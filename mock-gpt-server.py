#!/usr/bin/env python3
"""
本地 Mock GPT 服务，用于端到端测试。

功能:
- 提供 /v1/chat/completions POST 接口，返回一个固定结构的 JSON，
  以便前端的 JSON 提取与字段映射流程进行验证。
- 允许跨域（CORS），便于从 http://localhost:8000 网页直接调用。

运行方法:
- 在项目根目录执行: python3 mock-gpt-server.py
- 默认监听 http://localhost:8001/

依赖:
- 仅使用 Python 标准库，无需额外依赖。
"""

from http.server import BaseHTTPRequestHandler, HTTPServer
import json


class MockGPTHandler(BaseHTTPRequestHandler):
    """简易的 HTTP 处理器，模拟 GPT /v1/chat/completions 接口。"""

    def _set_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')

    def do_OPTIONS(self):  # 处理 CORS 预检
        self.send_response(204)
        self._set_cors_headers()
        self.end_headers()

    def do_POST(self):
        """处理 POST /v1/chat/completions，返回一个固定 JSON。"""
        if self.path != '/v1/chat/completions':
            self.send_response(404)
            self._set_cors_headers()
            self.end_headers()
            return

        try:
            length = int(self.headers.get('Content-Length', '0'))
            raw_body = self.rfile.read(length) if length > 0 else b''
            body_text = raw_body.decode('utf-8', errors='replace')
            # 尝试解析请求体，若失败继续返回固定响应
            try:
                req = json.loads(body_text or '{}')
            except Exception:
                req = {}

            content_obj = {
                "phonetic": "dɪˈsɪʒən",
                "partOfSpeech": "n.",
                "definition": "A choice made after consideration.",
                "brief": "A choice; resolution.",
                "chineseMeaning": "决定；抉择",
                "collocations": [
                    "make a decision",
                    "final decision"
                ],
                "example": "He finally made a decision.",
                "memoryTip": "de- + cision (cut) → decide",
                "association": "choose between options"
            }

            def _one_line_summary(o):
                b = str(o.get("brief", "")).strip()
                d = str(o.get("definition", "")).strip()
                zh = str(o.get("chineseMeaning", "")).strip()
                ph = str(o.get("phonetic", "")).strip()
                pos = str(o.get("partOfSpeech", "")).strip()
                s = b or d
                parts = [p for p in [s, zh, ph, pos] if p]
                out = "；".join(parts)
                return out[:180] if len(out) > 180 else out

            summary = _one_line_summary(content_obj)

            resp = {
                "id": "mock-123",
                "object": "chat.completion",
                "created": 0,
                "model": "mock-4o-mini",
                "choices": [
                    {
                        "index": 0,
                        "message": {
                            "role": "assistant",
                            "content": summary
                        },
                        "finish_reason": "stop"
                    }
                ]
            }

            data = json.dumps(resp, ensure_ascii=False).encode('utf-8')
            self.send_response(200)
            self._set_cors_headers()
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(data)))
            self.end_headers()
            self.wfile.write(data)
        except Exception as e:
            # 简单错误处理，返回 500
            msg = {
                "error": {
                    "message": f"Mock server error: {e}",
                    "type": "server_error"
                }
            }
            data = json.dumps(msg, ensure_ascii=False).encode('utf-8')
            self.send_response(500)
            self._set_cors_headers()
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(data)))
            self.end_headers()
            self.wfile.write(data)


def run_server(host: str = '127.0.0.1', port: int = 8001):
    """启动本地 Mock GPT 服务。"""
    httpd = HTTPServer((host, port), MockGPTHandler)
    print(f"Mock GPT server listening on http://{host}:{port}/v1/chat/completions")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        httpd.server_close()


if __name__ == '__main__':
    run_server()
