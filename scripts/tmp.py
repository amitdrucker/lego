import json
import os
import re

import threading
import httplib2
import requests
import shutil

import time
from bs4 import BeautifulSoup

h = httplib2.Http(".cache")


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


def download_file(url, name, folder):
    print name
    r = requests.get(url, stream=True)
    if r.status_code == 200:
        with open(folder + '/' + name + '.jpg', 'wb') as f:
            r.raw.decode_content = True
            shutil.copyfileobj(r.raw, f)


def fetch_images(uri, elem, attrs, curr_folder):
    http = httplib2.Http()
    content = http.request(uri)[1]
    soup = BeautifulSoup(content, 'html.parser')
    elems = soup.findAll(elem, attrs)
    for elem in elems:
        image_link = elem.findAll('img')[0]['src']
        name = image_link[image_link.rfind('/') + 1:].replace('.jpg', '')
        if not name:
            continue
        if curr_folder not in bricksInModel:
            bricksInModel[curr_folder] = []
        if name not in modelsInBrick:
            modelsInBrick[name] = []
        if name not in modelsInBrick:
            download_file(image_link, name, 'blocks')
        bricksInModel[curr_folder].append(name)
        modelsInBrick[name].append(curr_folder)


def start_link_process(curr_link, curr_folder):
    http = httplib2.Http()
    content = http.request(curr_link)[1]
    soup = BeautifulSoup(content, 'html.parser')
    if len(soup.findAll('p', {'class': 'pdfLink'})) == 0:
        return
    curr_link = soup.findAll('p', {'class': 'pdfLink'})[0].findAll('a')[-1]['href']
    fetch_images(curr_link, 'div', {'class': 'partsBox'}, curr_folder)


links = json.loads(open('data.json', 'r').read())
bricksInModel = json.loads(open('bricksInModel.json', 'r').read())
modelsInBrick = json.loads(open('modelsInBrick.json', 'r').read())
missing = {}

m = json.loads(open('missing.json', 'r').read())
for name in m:
    missing[name] = name

for link in links:
    folder = slugify(link[link.rfind('/') + 1:])
    if folder in missing:
        print 'found missing name ' + folder
        start_link_process(link, folder)
open('bricksInModel.json', 'w').write(json.dumps(bricksInModel))
open('modelsInBrick.json', 'w').write(json.dumps(modelsInBrick))
