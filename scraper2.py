import json
import os
import urllib2

import httplib2
from bs4 import BeautifulSoup

h = httplib2.Http(".cache")


def download_file(url, name, folder):
    try:
        response = urllib2.urlopen(url)
        file = open(folder + '/' + name, 'w')
        file.write(response.read())
        file.close()
    except:
        print ''


def get_links(uri, elem, attrs, find_all=False, download=False, fol=None,
              excludeText=None):
    resp, content = h.request(uri, "GET")
    soup = BeautifulSoup(content, 'html.parser')
    elems = soup.findAll(elem, attrs)
    result = []
    for elem in elems:
        if find_all:
            all_a = elem.findAll('a')
            for a in all_a:
                if excludeText and excludeText in a.text:
                    continue
                curr_link = a.attrs['href']
                print curr_link
                if a and curr_link not in result:
                    if download:
                        name = curr_link[curr_link.rfind('/') + 1:]
                        download_file(curr_link, name, fol)
                    else:
                        result.append(curr_link)
                else:
                    a = elem.find('a')
                    if a:
                        result.append(a.attrs['href'])
    return result


links = json.loads(open('data.json', 'r').read())

for link in links:
    folder = link[link.rfind('/') + 1:]
    if not os.path.exists(folder):
        os.makedirs(folder)
    else:
        continue
    get_links(link, 'p', {'class': 'pdfLink'}, True,
              True, folder, 'View which')
