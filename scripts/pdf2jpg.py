import os


def pdf2Jpg(path):
    pdf = file(path, "rb").read()

    startmark = "\xff\xd8"
    startfix = 0
    endmark = "\xff\xd9"
    endfix = 2
    i = 0
    max = 0
    maxStart = 0
    maxEnd = 0
    pageCount = 0

    njpg = 0
    while True:
        istream = pdf.find("stream", i)
        if istream < 0:
            break
        istart = pdf.find(startmark, istream, istream + 20)
        if istart < 0:
            i = istream + 20
            continue
        iend = pdf.find("endstream", istart)
        if iend < 0:
            print 'failed converting ' + path
            return
            # raise Exception("Didn't find end of stream!")
        iend = pdf.find(endmark, iend - 20)
        if iend < 0:
            print 'failed converting ' + path
            return
            # raise Exception("Didn't find end of JPG!")

        istart += startfix
        iend += endfix
        if iend - istart > max:
            max = iend - istart
            maxStart = istart
            maxEnd = iend
        njpg += 1
        i = iend
    print "JPG %d from %d to %d" % (njpg, maxStart, maxEnd)
    jpg = pdf[maxStart:maxEnd]
    jpgfile = file(path.replace('.pdf', '.jpg'), "wb")
    jpgfile.write(jpg)
    jpgfile.close()


def list_files(dir):
    subdirs = [x[0] for x in os.walk(dir)]
    for subdir in subdirs:
        files = os.walk(subdir).next()[2]
        hasJpg = False
        if len(files) > 0:
            for file in files:
                if 'jpg' in file:
                    hasJpg = True
                    break
            if not hasJpg:
                for file in files:
                    path = subdir + "/" + file
                    if path.endswith('.pdf'):
                        pdf2Jpg(path)


list_files("../data/pdfs")
