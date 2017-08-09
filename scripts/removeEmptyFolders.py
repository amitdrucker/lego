import json
import os

rootdir = '../data/pdfs'

models = json.loads(open('../data/bricksInModel.json', 'r').read())
modelsMap = json.loads(open('../data/bricksInModelsMap.json', 'r').read())
bricks = json.loads(open('../data/modelsInBrick.json', 'r').read())
bricksMap = {}
for brick in bricks.keys():
    bricksMap[brick] = {}
    for model in bricks[brick]:
        bricksMap[brick][model] = model

for model in models.keys():
    exists = os.path.exists('../data/pdfs/' + model)
    if not exists:
        print 'removing ' + model
        del models[model]
        del modelsMap[model]
        for brick in bricks.keys():
            if model in bricksMap[brick]:
                del bricksMap[brick][model]
                bricks[brick] = bricksMap[brick].keys()
open('../data/bricksInModel.json', 'w').write(json.dumps(models))
open('../data/bricksInModelsMap.json', 'w').write(json.dumps(modelsMap))
open('../data/modelsInBrick.json', 'w').write(json.dumps(bricks))
