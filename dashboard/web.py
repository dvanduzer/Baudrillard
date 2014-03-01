from flask import Flask
from flask import render_template

app = Flask(__name__)

app.debug=True

from redis import Redis
redis = Redis()

@app.route("/")
def switch_list():
    seed_list = redis.smembers('seed_list')
    return render_template('switch.html',seed_list=seed_list)

@app.route("/hn/<hashname>")
def display_routes(hashname):
    routing_table = redis.smembers('routes/{}'.format(hashname))
    return render_template('hashname.html', me=hashname, routing_table=routing_table)

if __name__ == "__main__":
    app.run()
