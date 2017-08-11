import json
import os

pdfsInModel = {}

subdirs = [x[0] for x in os.walk('../data/pdfs')]
for subdir in subdirs:
    model = subdir[subdir.rfind('\\') + 1:]
    files = os.walk(subdir).next()[2]
    pdfsInModel[model] = 0
    for file in files:
        if '.pdf' in file:
            pdfsInModel[model] += 1

open('../data/pdfsInModel.json', 'w').write(json.dumps(pdfsInModel))
