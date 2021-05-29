#!/bin/bash
# /usr/local/bin/usbcopy - read usb drive containing futura tropica content passing in path to mounted volume

( while ! mountpoint $1; do echo "not a mount"; sleep 1; done

SRC=$1/futura-tropica-content
DEST=/home/pi/futura-tropica-common-garden/public

if [ -d $SRC ]; then
    echo 'already exists, sync with server'
    # copy files to rhizome
    # to-do: delete files with --delete, fix ownership/perms, why is readme.txt blanked out?
    # read variables in from settings, also for setting server.js and name of show.json and subfolder for media
    rsync -vr $SRC/* $DEST >> $SRC/copy.log && /bin/echo -e "\nrsync completed: $(date)\n" >> $SRC/copy.log
    chown -R $USER:$USER $DEST
else
    echo 'initializing for content'
    # initialize drive as source of futura tropica content
    rsync -vr $DEST/usb $1
    mv $1/usb $1/futura-tropica-content
fi
 ) &
