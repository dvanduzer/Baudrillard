import os
from flask import Flask
from flask import render_template
from redis import Redis

app = Flask(__name__)

app.debug=True

redis_host = os.environ.get('REDISHOST', '127.0.0.1')
redis = Redis(host=redis_host)

@app.route("/")
def switch_list():
    seed_list = redis.smembers('seed_list')
    return render_template('switch.html',seed_list=seed_list)

@app.route("/hn/<hashname>")
def display_routes(hashname):
    routing_table = redis.smembers('routes/{}'.format(hashname))
    return render_template('hashname.html', me=hashname, routing_table=routing_table)

if __name__ == "__main__":
    app.run(host='0.0.0.0')
