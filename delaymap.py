import pygtfs
import datetime
import requests
from google.transit import gtfs_realtime_pb2
import pytz

tz = pytz.timezone('Europe/Berlin')

from flask import Flask, jsonify, send_from_directory
app = Flask(__name__)


@app.route("/")
@app.route("/index.html")
def index():
    return send_from_directory("public", "index.html")

@app.route("/server.js")
def server():
    return send_from_directory("public", "server.js")

@app.route("/background.png")
def background():
    return send_from_directory("public", "background.png")

@app.route("/trains.json")
def trains():
    schedule = pygtfs.Schedule("database.db")
    ret = []
    feed = gtfs_realtime_pb2.FeedMessage()
    response = requests.get("https://sncb-opendata.hafas.de/gtfs/realtime/c21ac6758dd25af84cca5b707f3cb3de", allow_redirects=True)
    feed.ParseFromString(response.content)
    for entity in feed.entity:
        trips = schedule.trips_by_id(entity.trip_update.trip.trip_id)
        if len(trips) == 0:
            continue
        trip = trips[0]
        current_delay = 0
        delays = {}

        for stop_time_update in entity.trip_update.stop_time_update:
            delays[stop_time_update.stop_id] = stop_time_update.arrival.delay

        prev_departure_time = None
        prev_stop = None
        for stop_time in trip.stop_times:
            stop = stop_time.stop
            if stop.stop_id in delays:
                current_delay = delays[stop.stop_id]

            arrival_seconds = stop_time.arrival_time.seconds
            departure_seconds = stop_time.departure_time.seconds

            arrival_time = datetime.time(arrival_seconds // 3600, (arrival_seconds // 60) % 60, arrival_seconds % 60)
            departure_time = datetime.time(departure_seconds // 3600, (departure_seconds // 60) % 60, departure_seconds % 60)
            current_time = datetime.datetime.now(tz).time()

            if prev_departure_time == None:
                prev_departure_time = arrival_time

            if prev_departure_time <= current_time <= arrival_time:
                if prev_stop == None:
                    prev_stop = stop

                prev_stop_lat = prev_stop.stop_lat
                prev_stop_lon = prev_stop.stop_lon
                next_stop_lat = stop.stop_lat
                next_stop_lon = stop.stop_lon

                total = arrival_seconds - seconds(prev_departure_time)
                current = arrival_seconds - seconds(current_time)
                if total == 0:
                    percentage = 1
                else:
                    percentage = current / total

                delta_lat = (next_stop_lat - prev_stop_lat) * percentage
                delta_lon = (next_stop_lon - prev_stop_lon) * percentage

                ret.append({
                    "name": trip.trip_headsign,
                    "lat": prev_stop_lat + delta_lat,
                    "lon": prev_stop_lon + delta_lon,
                    "delay": current_delay 
                })

            prev_departure_time = departure_time
            prev_stop = stop
    return jsonify(ret)


@app.route("/updatedb")
def updatedb():
    schedule = pygtfs.Schedule("database.db")
    r = requests.get("https://sncb-opendata.hafas.de/gtfs/static/c21ac6758dd25af84cca5b707f3cb3de", allow_redirects=True)
    with open('rawdata.zip', 'wb') as f:
        f.write(r.content)
    pygtfs.overwrite_feed(schedule, "rawdata.zip")
    return "ok"

def seconds(time):
    return (time.hour * 60 + time.minute) * 60 + time.second
