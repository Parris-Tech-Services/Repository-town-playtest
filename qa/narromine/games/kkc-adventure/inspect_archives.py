import zipfile
import os

root = os.path.dirname(__file__)
for name in ['Prompt-Linker.zip', 'RothfussGame.zip']:
    path = os.path.join(root, name)
    print('===', name, '===')
    if not os.path.exists(path):
        print('MISSING')
        continue
    with zipfile.ZipFile(path, 'r') as z:
        infos = z.infolist()
        print('entries', len(infos))
        for info in infos[:40]:
            print(info.filename)
        if len(infos) > 40:
            print('... plus', len(infos)-40, 'more entries')
