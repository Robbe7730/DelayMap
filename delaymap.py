import pygtfs
import datetime
import requests
from google.transit import gtfs_realtime_pb2
import pytz

tz = pytz.timezone('Europe/Berlin')

from flask import Flask, jsonify, send_from_directory
app = Flask(__name__)

@app.route("/")
def index():
    return send_from_directory("public", "index.html")

@app.route("/style.css")
def style():
    return send_from_directory("public", "style.css")

@app.route("/delaymap.js")
def javascript():
    return send_from_directory("public", "delaymap.js")

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
        current_arrive_delay = 0
        current_depart_delay = 0
        depart_delays = {}
        arrive_delays = {}

        for stop_time_update in entity.trip_update.stop_time_update:
            arrive_delays[stop_time_update.stop_id] = stop_time_update.arrival.delay
            depart_delays[stop_time_update.stop_id] = stop_time_update.departure.delay

        prev_departure_time = None
        prev_stop = None
        for stop_time in trip.stop_times:
            stop = stop_time.stop
            if stop.stop_id in arrive_delays:
                current_arrive_delay = arrive_delays[stop.stop_id]
            if stop.stop_id in depart_delays:
                current_depart_delay = depart_delays[stop.stop_id]

            arrival_seconds = stop_time.arrival_time.seconds + current_arrive_delay
            departure_seconds = stop_time.departure_time.seconds + current_depart_delay

            arrival_time = datetime.time(arrival_seconds // 3600, (arrival_seconds // 60) % 60, arrival_seconds % 60)
            departure_time = datetime.time(departure_seconds // 3600, (departure_seconds // 60) % 60, departure_seconds % 60)
            current_time = datetime.datetime.now(tz).time()

            if prev_departure_time is None:
                prev_departure_time = arrival_time

            if prev_departure_time <= current_time < arrival_time:
                if prev_stop is None:
                    prev_stop = stop

                prev_stop_lat = prev_stop.stop_lat
                prev_stop_lon = prev_stop.stop_lon
                next_stop_lat = stop.stop_lat
                next_stop_lon = stop.stop_lon

                total = arrival_seconds - seconds(prev_departure_time)
                current = arrival_seconds - seconds(current_time)
                if total == 0:
                    percentage = 1
                elif seconds(current_time) < seconds(prev_departure_time):
                    percentage = 0
                else:
                    percentage = 1 - (current / total)

                delta_lat = (next_stop_lat - prev_stop_lat) * percentage
                delta_lon = (next_stop_lon - prev_stop_lon) * percentage

                ret.append({
                    "name": translate(trip.trip_headsign, schedule),
                    "lat": prev_stop_lat + delta_lat,
                    "lon": prev_stop_lon + delta_lon,
                    "delay": current_arrive_delay,
                    "nextStopName": translate(stop.stop_name, schedule),
                    "isStopped": False,
                    "debug": {
                        "arrival_time": str(arrival_time),
                        "departure_time": str(departure_time),
                        "ent": str(entity),
                        "trip": str(trip)
                    }

                })
                break
            elif arrival_time <= current_time <= departure_time:
                ret.append({
                    "name": translate(trip.trip_headsign, schedule),
                    "lat": stop.stop_lat,
                    "lon": stop.stop_lon,
                    "delay": current_depart_delay,
                    "nextStopName": translate(stop.stop_name, schedule),
                    "isStopped": True
                })
                break

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

def translate(text, schedule):
    trans_object = schedule.translations_query.filter_by(trans_id = text, lang = "nl").first()
    if trans_object is None:
        return text
    return trans_object.translation

def seconds(time):
    return (time.hour * 60 + time.minute) * 60 + time.second
