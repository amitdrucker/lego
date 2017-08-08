import json

import httplib2
from bs4 import BeautifulSoup

h = httplib2.Http(".cache")


def get_links(uri, elem, attrs, find_all=False):
    resp, content = h.request(uri, "GET")
    soup = BeautifulSoup(content, 'html.parser')
    elems = soup.findAll(elem, attrs)
    result = []
    for elem in elems:
        if find_all:
            all_a = elem.findAll('a')
            for a in all_a:
                if a and a.attrs['href'] not in result:
                    result.append(a.attrs['href'])
        else:
            a = elem.find('a')
            if a:
                result.append(a.attrs['href'])
    return result


years = get_links("http://lego.brickinstructions.com/en/showallyears",
                  'td', {'class': 'yearTable'})
pages = []
for link in years:
    print 'working on year ' + link

    links = get_links(link, 'p', {'class': 'paginateGroup'}, True)
    pages.extend(links)

links = []
for link in pages:
    print 'working on link ' + link
    links.extend(get_links(link, 'div', {'class': 'setBox'}))

open('data.json', 'w').write(json.dumps(links))
