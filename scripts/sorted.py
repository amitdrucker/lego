import json

import operator

bricksByPop = {}
smallModels = []
mediumModels = []
largeModels = []
hughModels = []

modelsInBrick = json.loads(open('modelsInBrick.json', 'r').read())
bricksInModel = json.loads(open('bricksInModel.json', 'r').read())

for model in bricksInModel:
    if len(model) <= 20:
        smallModels.append(model)
    elif len(model) <= 50:
        mediumModels.append(model)
    elif len(model) <= 100:
        largeModels.append(model)
    else:
        hughModels.append(model)
    for brick in bricksInModel[model]:
        if brick not in bricksByPop:
            bricksByPop[brick] = 0
        bricksByPop[brick] += 1

tmpSortedArr = sorted(bricksByPop.items(), key=operator.itemgetter(1), reverse=True)
sortedArr = []
for item in tmpSortedArr:
    sortedArr.append(item[0])
open('bricksByPopularity.json', 'w').write(json.dumps(sortedArr))
open('smallModels.json', 'w').write(json.dumps(smallModels))
open('mediumModels.json', 'w').write(json.dumps(mediumModels))
open('largeModels.json', 'w').write(json.dumps(largeModels))
open('hughModels.json', 'w').write(json.dumps(hughModels))
