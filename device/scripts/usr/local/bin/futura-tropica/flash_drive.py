#!/usr/bin/python
import sys, os
import logging
import logging.handlers

my_logger = logging.getLogger('Flash_drive')
my_logger.setLevel(logging.DEBUG)
handler = logging.handlers.SysLogHandler(address = '/dev/log')
my_logger.addHandler(handler)

my_logger.debug('Flash drive active')
my_logger.debug('Argv[0]:'+sys.argv[0])

try:
  my_logger.debug('Argv[1]:'+sys.argv[1])
except:
  pass

os.system('sudo setsid /usr/local/bin/futura-tropica/usbcopy.sh ' + sys.argv[1])

