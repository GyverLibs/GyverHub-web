import argparse
import sys
import os
import shutil
import gzip
import zipfile
import re

import rjsmin
import rcssmin

HERE = os.path.dirname(__file__)
SRCDIR = os.path.join(HERE, 'src')
BUILDDIR = os.path.join(HERE, 'build')
DISTDIR = os.path.join(HERE, 'dist')

RE_TAG_SINGLELINE = re.compile(r'(?:/\*|<!--)\s*@!\[(?P<tag>[^\]]*)\]\s*(?:\*/|-->)')
RE_TAG_MULTILINE = re.compile(r'(?:/\*|<!--)\s*@!\[(?P<tag>[^\]]*)\]\s*(?:\*/|-->)(?P<data>.*?)(?:/\*|<!--)\s*@!/\[(?P<end_tag>[^\]]*)\]\s*(?:\*/|-->)')


js_lib_sources = [
    "src/inc/lib/hub/mqtt.min.js",
    "src/inc/lib/hub/codes.js",
    "src/inc/lib/hub/bt.js",
    "src/inc/lib/hub/tg.js",
    "src/inc/lib/hub/serial.js",
    "src/inc/lib/hub/utils.js",
    "src/inc/lib/hub/buffer.js",
    "src/inc/lib/hub/discover.js",
    "src/inc/lib/hub/conn_bt.js",
    "src/inc/lib/hub/conn_tg.js",
    "src/inc/lib/hub/conn_http.js",
    "src/inc/lib/hub/conn_mqtt.js",
    "src/inc/lib/hub/conn_serial.js",
    "src/inc/lib/hub/conn_ws.js",
    "src/inc/lib/hub/device.js",
    "src/inc/lib/hub/GyverHub.js",
]

js_sources = [
    *js_lib_sources,

    "src/inc/lib/qrcode.min.js",
    "src/inc/lib/sort-paths.min.js",
    "src/inc/lib/pickr.min.js",
    "src/inc/utils.js",

    "src/inc/widgets/render.js",
    "src/inc/widgets/menu.js",
    "src/inc/widgets/widget.js",
    "src/inc/widgets/button.js",
    "src/inc/widgets/label.js",
    "src/inc/widgets/title.js",
    "src/inc/widgets/plugin.js",
    "src/inc/widgets/switch.js",
    "src/inc/widgets/swicon.js",
    "src/inc/widgets/display.js",
    "src/inc/widgets/image.js",
    "src/inc/widgets/table.js",
    "src/inc/widgets/datetime.js",
    "src/inc/widgets/popup.js",
    "src/inc/widgets/log.js",
    "src/inc/widgets/text.js",
    "src/inc/widgets/input.js",
    "src/inc/widgets/pass.js",
    "src/inc/widgets/area.js",
    "src/inc/widgets/slider.js",
    "src/inc/widgets/spinner.js",
    "src/inc/widgets/custom.js",
    "src/inc/widgets/func.js",
    "src/inc/widgets/select.js",
    "src/inc/widgets/color.js",
    "src/inc/widgets/led.js",
    "src/inc/widgets/icon.js",
    "src/inc/widgets/ui_file.js",
    "src/inc/widgets/hook.js",
    "src/inc/widgets/gauge.js",
    "src/inc/widgets/gauge_r.js",
    "src/inc/widgets/gauge_l.js",
    "src/inc/widgets/joy.js",
    "src/inc/widgets/dpad.js",
    "src/inc/widgets/flags.js",
    "src/inc/widgets/tabs.js",
    "src/inc/widgets/canvas.js",
    "src/inc/widgets/stream.js",
    "src/inc/widgets/plot.js",

    "src/inc/controls.js",
    "src/inc/lang.js",
    "src/inc/render.js",
    "src/inc/config.js",
    "src/inc/projects.js",
    "src/inc/ui.js",
    "src/inc/fs.js",
    "src/inc/index.js",
    "src/inc/updates.js",
    "src/inc/events.js",
    "src/inc/test.js",
]

css_sources = [
    'src/inc/lib/nano.min.css',
    'src/inc/style/main.css',
    'src/inc/style/ui.css',
    'src/inc/style/widgets.css',
]

js_sw_sources = [
    'src/sw.js',
]

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


def read_all(sources):
    res = []
    for file in sources:
        print("R", file)
        with open(file, 'rt', encoding='utf-8') as f:
            res.append(f.read())
    
    return '\n'.join(res)


def write_text(path, text):
    print("W", path)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'wt', encoding='utf-8') as f:
        f.write(text)


def compile_replace(target, source):
    env = {
        'target': target,
        'version': '0.53.26b',
        'sw_cache': sw_cache
    }
    def _matched(match: re.Match[str]):
        d = match.groupdict()
        tag = d['tag']
        end_tag = d.get('end_tag')
        if end_tag is not None and end_tag != tag:
            raise RuntimeError(f'End tag does not match {tag!r} != {end_tag!r}')

        tag, _, arg = tag.partition(':')
        tag = tag.strip()
        arg = arg.strip()
        data = d.get('data', '')

        if tag == 'env' or tag == '':
            return env.get(arg, '')
        
        if tag == 'if_target':
            return data if target == arg else ''
        
        if tag == 'if_not_target':
            return data if target != arg else ''

        print(tag, data)
        return ''

    source = RE_TAG_MULTILINE.sub(_matched, source)
    source = RE_TAG_SINGLELINE.sub(_matched, source)

    # source = source.replace('__VER__', version)
    # source = source.replace('\'__CACHE__\'', sw_cache)
    # source = source.replace('__NOTES__', notes)

    return source


def compile_js(target, out_path, sources):
    source = read_all(sources)
    source = compile_replace(target, source)
    source = rjsmin.jsmin(source)
    write_text(out_path, source)

def compile_css(target, out_path, sources):
    source = read_all(sources)
    source = compile_replace(target, source)
    source = rcssmin.cssmin(source)
    write_text(out_path, source)


def compile_html(target, out_path, source):
    source = read_all([source])
    source = compile_replace(target, source)
    write_text(out_path, source)


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

    write_text(dst, data)


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

    # Lib

    # compile_js('lib', os.path.join(DISTDIR, 'GyverHub.min.js'), js_lib_sources)

    # Host

    # for file in copy_web:
    #     dst = os.path.join(BUILDDIR, 'host', file)
    #     os.makedirs(os.path.dirname(dst), exist_ok=True)
    #     shutil.copyfile(os.path.join(SRCDIR, file), dst)

    # shutil.copyfile('src/inc/style/fonts/fa-solid-900.woff2', 'build/host/fonts/fa-solid-900.woff2')
    # shutil.copyfile('src/inc/style/fonts/Robotocondensed.woff2', 'build/host/fonts/Robotocondensed.woff2')

    # compile_js('host', os.path.join(BUILDDIR, 'host', 'script.js'), js_sources)
    # compile_js('host', os.path.join(BUILDDIR, 'host', 'sw.js'), js_sw_sources)
    # compile_css('host', os.path.join(BUILDDIR, 'host', 'style.css'), css_sources)

    html_source = os.path.join(SRCDIR, 'index.html')
    compile_html('host', os.path.join(BUILDDIR, 'host', 'index.html'), html_source)
    return

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
