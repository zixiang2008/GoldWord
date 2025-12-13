#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <libgen.h>

static char* join(const char* a, const char* b) {
    size_t la = strlen(a), lb = strlen(b);
    char* r = (char*)malloc(la + lb + 2);
    memcpy(r, a, la);
    r[la] = '/';
    memcpy(r + la + 1, b, lb);
    r[la + lb + 1] = '\0';
    return r;
}

int main() {
    char exe[4096];
    uint32_t size = sizeof(exe);
    if (_NSGetExecutablePath(exe, &size) != 0) return 1;
    char* dir = dirname(exe);
    char* contents = dirname(dir);
    char* resources = join(contents, "Resources");
    char* html = join(resources, "index.html");
    char* cmd = (char*)malloc(strlen(html) + 6);
    strcpy(cmd, html);
    int rc = execlp("open", "open", cmd, NULL);
    free(resources); free(html); free(cmd);
    return rc == -1 ? 1 : 0;
}
