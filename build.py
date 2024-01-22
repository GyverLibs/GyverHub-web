import argparse
import sys
import os
import shutil
import gzip
import zipfile
import re
import base64

import rjsmin
import rcssmin

HERE = os.path.dirname(__file__)
SRCDIR = os.path.join(HERE, 'src')
BUILDDIR = os.path.join(HERE, 'build')
DISTDIR = os.path.join(HERE, 'dist')

RE_TAG_SINGLELINE = re.compile(r'(?:/\*|<!--)\s*@!\[(?P<tag>[^\]]*)\]\s*(?:\*/|-->)')
RE_TAG_MULTILINE = re.compile(r'(?:/\*|<!--)\s*@\[(?P<tag>[^\]]*)\]\s*(?:\*/|-->)(?P<data>(.|\n)*?)(?:/\*|<!--)\s*@/\[(?P<end_tag>[^\]]*)\]\s*(?:\*/|-->)', re.MULTILINE)

sw_cache = '''
  '/',
  '/fa-solid-900.woff2',
  '/Robotocondensed.woff2',
  '/favicon.svg',
  '/index.html',
  '/script.js',
  '/style.css',
'''

copy_web = [
    'favicon.svg',
    'manifest.json',
    'icons/icon-192x192.png',
    'icons/icon-256x256.png',
    'icons/icon-384x384.png',
    'icons/icon-512x512.png',
]

inc_min = '''
  <script src="script.js?__VER__="></script>
  <link href="style.css?__VER__=" rel="stylesheet">
'''

metrika_code = '''
  <script type="text/javascript">
    (function (m, e, t, r, i, k, a) {
        m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments) };
        m[i].l = 1 * new Date();
        for (var j = 0; j < document.scripts.length; j++) { if (document.scripts[j].src === r) { return; } }
        k = e.createElement(t), a = e.getElementsByTagName(t)[0], k.async = 1, k.src = r, a.parentNode.insertBefore(k, a)
    })
        (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
    ym(93507215, "init", {clickmap: true, trackLinks: true, accurateTrackBounce: true});
  </script>
  <noscript>
    <div><img src="https://mc.yandex.ru/watch/93507215" style="position:absolute; left:-9999px;" alt="" /></div>
  </noscript>
'''


class PathResolver:
    def __init__(self, src_dir: str, build_dir: str, dist_dir: str):
        self.src_dir = src_dir
        self.build_dir = build_dir
        self.dist_dir = dist_dir

    def resolve(self, path: str, target: str, dist: bool = False):
        if dist:
            return os.path.join(self.dist_dir, target, path)

        if path.startswith('@'):
            return os.path.join(self.build_dir, target, path[1:])
        
        return os.path.join(self.src_dir, path)


class Compiler:
    def __init__(self, target: str, env: dict[str, str], pr: PathResolver):
        self._env = env.copy()
        self._env['target'] = target
        self._target = target
        self._resolver = pr

    def _resolve_read(self, path):
        path = self._resolver.resolve(path, self._target)
        with open(path, 'rt', encoding='utf-8') as f:
            return f.read()

    def _resolve_write(self, path: str, data: str, options: list):
        path = self._resolver.resolve(path, self._target, dist='dist' in options)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, 'wt', encoding='utf-8') as f:
            f.write(data)

    def _include(self, path: str, options: list):
        data = self._resolve_read(path)

        if "compile" in options:
            data = self.compile_str(data)

        if "js" in options:
            data = rjsmin.jsmin(data)

        if "css" in options:
            data = rcssmin.cssmin(data)

        if "html" in options:
            data = minify_html(data)

        return data

    def _re_matched(self, match: re.Match[str]) -> str:
        d = match.groupdict()
        tag = d['tag']
        end_tag = d.get('end_tag')
        if end_tag is not None and end_tag != tag:
            raise RuntimeError(f'End tag does not match {tag!r} != {end_tag!r}')

        tag, _, args = tag.partition(':')
        tag = tag.strip()
        args = [i.strip() for i in args.split(',')]
        data = d.get('data', '')

        if tag == 'env' or tag == '':
            return self._env.get(args[0], '')
        
        if tag == 'if_target':
            return data if self._target in args else ''
        
        if tag == 'if_not_target':
            return '' if self._target in args else data

        if tag == 'include':
            return self._include(args[0], args[1:])

        if tag == 'copy':
            self.compile_file(args[0], args[1], args[2:])
            return ''
        
        if tag == 'base64_include':
            path = self._resolver.resolve(args[0])
            return base64_file(path)

        print(tag, args, data)
        return ''

    def compile_str(self, source: str):
        source = RE_TAG_MULTILINE.sub(self._re_matched, source)
        source = RE_TAG_SINGLELINE.sub(self._re_matched, source)
        return source
    
    def compile_file(self, source: str, target: str, options: list = None):
        if options is None:
            options = ['compile']
        
        data = self._include(source, options)
        self._resolve_write(target, data, options)


def base64_file(path: str) -> str:
    with open(path, 'rb') as f:
        data = f.read()
    return base64.b64encode(data).decode('ascii')


def minify_html(text):
    return text


def pack_gzip(src, dst):
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    with open(src, 'rb') as f_in, gzip.open(dst, 'wb') as f_out:
        shutil.copyfileobj(f_in, f_out)


def pack_zip(srcdir, dst):
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    with zipfile.ZipFile(dst, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for i in os.listdir(srcdir):
            zf.write(os.path.join(srcdir, i), i)


def file_to_h(src, dst, name, version):
    with open(src, "rb") as f:
        bytes = bytearray(f.read())

    data = '#pragma once\n'
    data += '// app v' + version + '\n\n'
    data += '#define ' + name + '_len ' + str(len(bytes)) + '\n\n'
    data += 'const uint8_t ' + name + '[] PROGMEM = {\n\t'

    count = 0
    for b in bytes:
        data += "0x{:02x}".format(b) + ', '
        count += 1
        if count % 16 == 0:
            data += '\n\t'

    data += '\n};'

    os.makedirs(os.path.dirname(dst), exist_ok=True)
    with open(dst, 'wt', encoding='utf-8') as f:
        f.write(data)


def git_get_version():
    return None


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--automatic', help='Enable CI/github fixes', action='store_true')
    parser.add_argument('--version', help='Specify version', type=str)
    parser.add_argument('--next-version', help='Generate new version', action='store_true')
    parser.add_argument('--clean', help='Clean build files', action='store_true')
    parser.add_argument('--build', help='Build', action='store_true')

    args = parser.parse_args()

    if sum((args.next_version, args.clean, args.build)) != 1:
        print("You must specify exactly one of --build, --clean and --next-version!", file=sys.stderr)
        exit(1)
    
    if args.clean:
        shutil.rmtree(BUILDDIR, ignore_errors=True)
        shutil.rmtree(DISTDIR, ignore_errors=True)
        return
    
    if args.next_version:
        version = git_get_version()
        if version is None:
            with open(os.path.join(HERE, 'version.txt'), 'rt') as f:
                version = f.read().strip()
        
        beta = version.endswith('b')
        version = version.rstrip('b').split('.')
        version = [int(i) for i in version]
        version[-1] += 1
        version = '.'.join((str(i) for i in version))
        if beta:
            version += 'b'
        
        print(version)
        return
    
    print("Starting build...")

    resolver = PathResolver(SRCDIR, BUILDDIR, DISTDIR)
    env = {

    }

    # Lib
    # Compiler('lib', env, resolver).compile_file('inc/lib/hub/index.js', 'GyverHub.min.js', ['compile', 'js', 'dist'])

    # Host

    Compiler('host', env, resolver).compile_file('index.html', '@index.html', ['compile', 'html'])
    # for file in copy_web:
    #     dst = os.path.join(BUILDDIR, 'host', file)
    #     os.makedirs(os.path.dirname(dst), exist_ok=True)
    #     shutil.copyfile(os.path.join(SRCDIR, file), dst)

    # shutil.copyfile('src/inc/style/fonts/fa-solid-900.woff2', 'build/host/fonts/fa-solid-900.woff2')
    # shutil.copyfile('src/inc/style/fonts/Robotocondensed.woff2', 'build/host/fonts/Robotocondensed.woff2')

    # compile_js('host', os.path.join(BUILDDIR, 'host', 'script.js'), js_sources)
    # compile_js('host', os.path.join(BUILDDIR, 'host', 'sw.js'), js_sw_sources)
    # compile_css('host', os.path.join(BUILDDIR, 'host', 'style.css'), css_sources)

    return
    html_source = os.path.join(SRCDIR, 'index.html')
    compile_html('host', os.path.join(BUILDDIR, 'host', 'index.html'), html_source)

    pack_zip(os.path.join(BUILDDIR, 'host'), os.path.join(DISTDIR, 'host.zip'))

    # mobile

    compile_js('mobile', os.path.join(BUILDDIR, 'mobile', 'script.js'), js_sources)
    compile_css('mobile', os.path.join(BUILDDIR, 'mobile', 'style.css'), css_sources)
    compile_html('mobile', os.path.join(DISTDIR, 'host', 'mobile.html'), html_source)

    # desktop

    compile_js('desktop', os.path.join(BUILDDIR, 'desktop', 'script.js'), js_sources)
    compile_css('desktop', os.path.join(BUILDDIR, 'desktop', 'style.css'), css_sources)
    compile_html('desktop', os.path.join(DISTDIR, 'host', 'desktop.html'), html_source)

    # local

    compile_js('local', os.path.join(BUILDDIR, 'local', 'script.js'), js_sources)
    compile_css('local', os.path.join(BUILDDIR, 'local', 'style.css'), css_sources)
    compile_html('local', os.path.join(DISTDIR, 'host', 'local.html'), html_source)

    # esp 

    compile_js('esp', os.path.join(BUILDDIR, 'esp', 'script.js'), js_sources)
    compile_css('esp', os.path.join(BUILDDIR, 'esp', 'style.css'), css_sources)
    compile_html('esp', os.path.join(BUILDDIR, 'esp', 'index.html'), html_source)

    pack_gzip(os.path.join(BUILDDIR, 'esp', 'script.js'), os.path.join(BUILDDIR, 'esp-gz', 'script.js.gz'))
    pack_gzip(os.path.join(BUILDDIR, 'esp', 'style.css'), os.path.join(BUILDDIR, 'esp-gz', 'style.css.gz'))
    pack_gzip(os.path.join(BUILDDIR, 'esp', 'index.html'), os.path.join(BUILDDIR, 'esp-gz', 'index.html.gz'))

    file_to_h(os.path.join(BUILDDIR, 'esp-gz', 'script.js.gz'), os.path.join(BUILDDIR, 'esp-h', 'script.h'), 'hub_script_h', args.version)
    file_to_h(os.path.join(BUILDDIR, 'esp-gz', 'style.css.gz'), os.path.join(BUILDDIR, 'esp-h', 'style.h'), 'hub_style_h', args.version)
    file_to_h(os.path.join(BUILDDIR, 'esp-gz', 'index.html.gz'), os.path.join(BUILDDIR, 'esp-h', 'index.h'), 'hub_index_h', args.version)

    pack_zip(os.path.join(BUILDDIR, 'esp-h'), os.path.join(DISTDIR, 'esp-headers.zip'))



if __name__ == '__main__':
    main()
