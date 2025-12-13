#!/usr/bin/env python3
import subprocess, sys, json, argparse, re, html

def run(cmd):
    p = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    return p.returncode, p.stdout

def parse_apksigner_verbose(text):
    def flag(name):
        m = re.search(rf"{name}\s*:\s*(true|false)", text, re.IGNORECASE)
        return bool(m and m.group(1).lower() == 'true')
    info = {
        'v1': flag('Verified using v1 scheme'),
        'v2': flag('Verified using v2 scheme'),
        'v3': flag('Verified using v3 scheme'),
        'signers': []
    }
    for block in re.split(r"Signer #\d+ certificate:", text)[1:]:
        sha256 = re.search(r"SHA-256 digest:\s*([A-F0-9:]+)", block)
        subject = re.search(r"Subject:\s*(.+)", block)
        issuer = re.search(r"Issuer:\s*(.+)", block)
        validity = re.search(r"Validity:\s*From\s*(.+?)\s*To\s*(.+)", block)
        info['signers'].append({
            'sha256': sha256.group(1) if sha256 else '',
            'subject': subject.group(1) if subject else '',
            'issuer': issuer.group(1) if issuer else '',
            'valid_from': validity.group(1) if validity else '',
            'valid_to': validity.group(2) if validity else ''
        })
    return info

def parse_jarsigner(text):
    signer = re.search(r"X\.509,\s*(.+)", text)
    algo = re.search(r"Signature algorithm:\s*([^\n]+)", text)
    return {
        'signer': signer.group(1) if signer else '',
        'algorithm': algo.group(1) if algo else ''
    }

def render_html(report):
    b = []
    b.append('<!doctype html><meta charset="utf-8"><title>APK Signature Report</title>')
    b.append('<h2>APK Signature Verification</h2>')
    b.append(f"<p>V1: {'✅' if report['apk']['v1'] else '❌'} | V2: {'✅' if report['apk']['v2'] else '❌'} | V3: {'✅' if report['apk']['v3'] else '❌'}</p>")
    b.append('<h3>Signers</h3>')
    b.append('<ul>')
    for s in report['apk'].get('signers', []):
        b.append(f"<li><pre>{html.escape(json.dumps(s, ensure_ascii=False, indent=2))}</pre></li>")
    b.append('</ul>')
    b.append('<h2>AAB JAR Signing</h2>')
    b.append(f"<pre>{html.escape(json.dumps(report.get('aab', {}), ensure_ascii=False, indent=2))}</pre>")
    return ''.join(b)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--apk', required=True)
    ap.add_argument('--aab', required=False)
    ap.add_argument('--apksigner', required=True)
    ap.add_argument('--out-json', required=True)
    ap.add_argument('--out-html', required=True)
    args = ap.parse_args()

    code, out = run([args.apksigner, 'verify', '--verbose', '--print-certs', args.apk])
    apk_info = parse_apksigner_verbose(out)
    if not apk_info['v2'] or not apk_info['v1']:
        sys.stderr.write('Signature verification failed: V1/V2 required\n')
        print(out)
        sys.exit(1)

    aab_info = {}
    if args.aab:
        jc, jout = run(['jarsigner', '-verify', '-verbose', '-certs', args.aab])
        aab_info = parse_jarsigner(jout)
        if jc != 0:
            sys.stderr.write('AAB jarsigner verification failed\n')
            print(jout)
            sys.exit(1)

    report = {'apk': apk_info, 'aab': aab_info}
    with open(args.out_json, 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    with open(args.out_html, 'w', encoding='utf-8') as f:
        f.write(render_html(report))
    print('Report written')

if __name__ == '__main__':
    main()

