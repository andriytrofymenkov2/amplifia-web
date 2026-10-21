# Arma index.html: inserta src/engine.js dentro de la página (así el motor 3D funciona
# también abriendo el archivo con doble clic, donde Chrome bloquea módulos externos).
import pathlib
root = pathlib.Path(__file__).parent
html = (root / 'src/index.html').read_text(encoding='utf-8')
eng = (root / 'src/engine.js').read_text(encoding='utf-8')
(root / 'index.html').write_text(html.replace('/*ENGINE*/', eng), encoding='utf-8')
print('index.html ok')
