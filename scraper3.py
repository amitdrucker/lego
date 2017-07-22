import json

import httplib2
import requests
import shutil
from bs4 import BeautifulSoup

h = httplib2.Http(".cache")


def download_file(url, name, folder):
    print name
    r = requests.get(url, stream=True)
    if r.status_code == 200:
        with open(folder + '/' + name + '.jpg', 'wb') as f:
            r.raw.decode_content = True
            shutil.copyfileobj(r.raw, f)


def fetch_images(uri, elem, attrs, folder):
    resp, content = h.request(uri, "GET")
    soup = BeautifulSoup(content, 'html.parser')
    elems = soup.findAll(elem, attrs)
    result = []
    for elem in elems:
        image_link = elem.findAll('img')[0]['src']
        name = image_link[image_link.rfind('/') + 1:].replace('.jpg', '')
        if folder not in bricksInModel:
            bricksInModel[folder] = []
        if name not in modelsInBrick:
            modelsInBrick[name] = []
            download_file(image_link, name, 'blocks')
        bricksInModel[folder].append(name)
        modelsInBrick[name].append(folder)


links = json.loads(open('data.json', 'r').read())
bricksInModel = {}
modelsInBrick = {}

for link in links:
    print 'working on ' + link
    folder = link[link.rfind('/') + 1:]
    resp, content = h.request(link, "GET")
    soup = BeautifulSoup(content, 'html.parser')
    link = soup.findAll('p', {'class': 'pdfLink'})[0].findAll('a')[2]['href']
    fetch_images(link, 'div', {'class': 'partsBox'}, folder)
open('bricksInModel.json', 'w').write(json.dumps(bricksInModel))
open('modelsInBrick.json', 'w').write(json.dumps(modelsInBrick))
