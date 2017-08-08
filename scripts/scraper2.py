import json
import os
import re
import shutil
import threading
import urllib2

import httplib2
import time

import requests
from bs4 import BeautifulSoup

h = httplib2.Http(".cache")
tcount = 0


def download_file(url, name, fol):
    global tcount
    print name
    r = requests.get(url, stream=True)
    if r.status_code == 200:
        with open(fol + '/' + name, 'wb') as f:
            r.raw.decode_content = True
            shutil.copyfileobj(r.raw, f)
    tcount -= 1


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


def get_links(uri, elem, attrs, fol, excludeText):
    global tcount
    resp, content = h.request(uri, "GET")
    soup = BeautifulSoup(content, 'html.parser')
    elems = soup.findAll(elem, attrs)
    for elem in elems:
        all_a = elem.findAll('a')
        for a in all_a:
            if excludeText and excludeText in a.text:
                continue
            curr_link = a.attrs['href']
            if '?' in curr_link:
                print 'changing link name from ' + curr_link
                curr_link = curr_link[:curr_link.rfind('?')]
                print 'to ' + curr_link
            print curr_link
            name = curr_link[curr_link.rfind('/') + 1:]
            tcount += 1
            while tcount > 30:
                time.sleep(0.1)
            t = threading.Thread(target=download_file, args=(curr_link, name, fol))
            t.daemon = True
            t.start()


links = json.loads(open('data.json', 'r').read())

for link in links:
    if '?' in link:
        link = link[:link.rfind('?')]
    folder = 'data/' + slugify(link[link.rfind('/') + 1:])
    print 'working on ' + link
    if not os.path.exists(folder):
        os.makedirs(folder)
        try:
            get_links(link, 'p', {'class': 'pdfLink'}, folder, 'View which')
        except Exception, e:
            print e
            pass

    else:
        print 'extists. skipping...'
