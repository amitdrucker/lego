import json
import os

import threading
import httplib2
import requests
import shutil

import time
from bs4 import BeautifulSoup

h = httplib2.Http(".cache")
tcount = 0


def download_file(url, name, folder):
    global tcount
    print name
    r = requests.get(url, stream=True)
    if r.status_code == 200:
        with open(folder + '/' + name + '.jpg', 'wb') as f:
            r.raw.decode_content = True
            shutil.copyfileobj(r.raw, f)
    tcount -= 1


def fetch_images(uri, elem, attrs, folder):
    global tcount
    resp, content = h.request(uri, "GET")
    soup = BeautifulSoup(content, 'html.parser')
    elems = soup.findAll(elem, attrs)
    result = []
    for elem in elems:
        image_link = elem.findAll('img')[0]['src']
        name = image_link[image_link.rfind('/') + 1:].replace('.jpg', '')
        if not name:
            continue
        if folder not in bricksInModel:
            bricksInModel[folder] = []
        if name not in modelsInBrick:
            modelsInBrick[name] = []
        if name not in allFileNames:
            tcount += 1
            while tcount > 30:
                time.sleep(0.1)
            t = threading.Thread(target=download_file, args=(image_link, name, 'blocks'))
            t.daemon = True
            t.start()
        bricksInModel[folder].append(name)
        modelsInBrick[name].append(folder)


links = json.loads(open('data.json', 'r').read())
bricksInModel = json.loads(open('bricksInModel.json', 'r').read())
modelsInBrick = json.loads(open('modelsInBrick.json', 'r').read())
allFileNames = {}
files = os.listdir('blocks')
for fileName in files:
    fileName = fileName.replace('.jpg', '')
    allFileNames[fileName] = fileName

for link in links:
    print 'working on ' + link
    folder = link[link.rfind('/') + 1:]
    if folder in bricksInModel:
        continue
    resp, content = h.request(link, "GET")
    soup = BeautifulSoup(content, 'html.parser')
    if len(soup.findAll('p', {'class': 'pdfLink'})) == 0:
        continue
    link = soup.findAll('p', {'class': 'pdfLink'})[0].findAll('a')[-1]['href']
    fetch_images(link, 'div', {'class': 'partsBox'}, folder)
    open('bricksInModel.json', 'w').write(json.dumps(bricksInModel))
    open('modelsInBrick.json', 'w').write(json.dumps(modelsInBrick))
