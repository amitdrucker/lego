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


class Counter(object):
    def __init__(self):
        self.lock = threading.Lock()
        self.value = 0

    def increment(self):
        self.lock.acquire()
        try:
            self.value += 1
        finally:
            self.lock.release()

    def decrement(self):
        self.lock.acquire()
        try:
            self.value -= 1
        finally:
            self.lock.release()

    def get(self):
        return self.value


c1 = Counter()
c2 = Counter()


def download_file(url, name, folder):
    print name
    r = requests.get(url, stream=True)
    if r.status_code == 200:
        with open(folder + '/' + name + '.jpg', 'wb') as f:
            r.raw.decode_content = True
            shutil.copyfileobj(r.raw, f)
    allFileNames[name] = name


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
        if name not in allFileNames:
            download_file(image_link, name, 'blocks')
            # c1.increment()
            # while c1.get() > 30:
            #     time.sleep(0.1)
            # th = threading.Thread(target=download_file, args=(image_link, name, 'blocks'))
            # th.daemon = True
            # th.start()
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
    # c2.decrement()


links = json.loads(open('data.json', 'r').read())
bricksInModel = {}
modelsInBrick = {}
allFileNames = {}
files = os.listdir('blocks')
for fileName in files:
    fileName = fileName.replace('.jpg', '')
    allFileNames[fileName] = fileName

for link in links:
    print 'working on ' + link
    folder = slugify(link[link.rfind('/') + 1:])
    if folder in bricksInModel:
        continue
    start_link_process(link, folder)
    # c2.increment()
    # while c2.get() > 500:
    #     time.sleep(0.1)
    # t = threading.Thread(target=start_link_process, args=(link, folder))
    # t.daemon = True
    # t.start()

open('bricksInModel.json', 'w').write(json.dumps(bricksInModel))
open('modelsInBrick.json', 'w').write(json.dumps(modelsInBrick))
