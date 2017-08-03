import os

os.chdir('blocks')
for filename in os.listdir("."):
    if '.png' in filename:
        print 'renaming ' + filename + ' to ' + filename[:-4]
        os.rename(filename, filename[:-4])
