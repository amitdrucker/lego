import json
import os
import re


def slugify(value):
    """
    Normalizes string, converts to lowercase, removes non-alpha characters,
    and converts spaces to hyphens.
    """
    import unicodedata
    value = unicodedata.normalize('NFKD', value).encode('ascii', 'ignore')
    value = unicode(re.sub('[^\w\s-]', '', value).strip().lower())
    value = unicode(re.sub('[-\s]+', '-', value))
    return value


bricksInModel = json.loads(open('bricksInModel.json', 'r').read())
modelsInBrick = json.loads(open('modelsInBrick.json', 'r').read())
models = {}
for model in bricksInModel.keys():
    models[model] = model
files = os.listdir('data')
for fileName in files:
    if fileName in models:
        del models[fileName]
    else:
        print 'bricksInModel doesn\'t contain ' + fileName
for k in models:
    print 'data files don\'t contain ' + k
