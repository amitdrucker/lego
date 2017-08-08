import json

bricksInModelsMap = json.loads(open('bricksInModelsMap.json', 'r').read())
bricksInModel = json.loads(open('bricksInModel.json', 'r').read())

for k in bricksInModelsMap.keys():
    if len(bricksInModelsMap[k]) != len(bricksInModel[k]):
        print 'before: len ' + str(len(bricksInModel[k]))
        print bricksInModel[k]
        tmp = {}
        for i in range(len(bricksInModel[k]) - 1, -1, -1):
            item = bricksInModel[k][i]
            if item in tmp:
                print 'removing ' + item
                del bricksInModel[k][i]
            tmp[item] = True
        print 'after: len ' + str(len(bricksInModel[k]))
        print bricksInModel[k]
# open('bricksInModel.json', 'w').write(json.dumps(bricksInModel))
