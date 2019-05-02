import os
from gpiozero import CPUTemperature
from time import sleep, strftime, time
import matplotlib.pyplot as plt

DATA_DIR = "/home/pi/Documents/moonarrow2/temperature/data"
TS_FORMAT = "%Y-%m-%d %H:%M:%S"
SAMPLE_INTERVAL = 60  # seconds

if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

cpu = CPUTemperature()

plt.ion()
x = []
y = []

def write_temp(temp):
    csv = os.path.join(DATA_DIR, "cpu_temp.csv")
    with open(csv, "a") as log:
        log.write("{0},{1}\n".format(strftime(TS_FORMAT),str(temp)))

def graph(temp):
    y.append(temp)
    x.append(time())
    plt.clf()
    plt.scatter(x,y)
    plt.plot(x,y)
    plt.draw()

while True:
    temp = cpu.temperature
    write_temp(temp)
#    graph(temp)
    sleep(SAMPLE_INTERVAL)
