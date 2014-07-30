var ProJax = {
	get: function(url, args) {
		return new Promise(function(resolve, reject) {
			$.get(url, args).done(resolve).fail(reject);
		});
	}
};

function parseWSJ(data) {
	var rv = {};
	$.csv.toArrays(data, {separator: '\t'}).forEach(function(row) {
		var matches;
		if (matches = /(.*) \((.*)\)/.exec(row[0])) {
			rv[matches[2]] = {symbol: matches[2], name: matches[1]};
		}
	});
	return Promise.resolve(rv);
}

function displayList(sel, data) {
	var parent = $(sel);
	for(var sym in data) {
		var rec = data[sym];
		parent.append($('<li>').stock(rec.symbol, rec.name));
	}
}

function mergeData(datas) {
	var rv = {};
	datas.forEach(function(data) {
		for (var sym in data) {
			var rec = data[sym];
			if (rv[sym] == undefined) {
				rv[sym] = rec; // FIXME: Copy?
				rv[sym].count = 1;
			} else {
				rv[sym].count++;
			}
		}
	});
	return Promise.resolve(rv);
}

function getDates(data) {
	return new Promise(function(resolve, reject) {
		ProJax.get("http://download.finance.yahoo.com/d/quotes.csv", {
			s: Object.keys(data),
			f: 'snr1q0'
		})
		.catch(reject)
		.then(function() {
			var FORMATS = [
				"DD-MMM-YY",
				"MMM DD"
			];

			$.csv.toArrays(data).forEach(function(row) {
				if (row.length != 4) {
					return;
				}
				var symbol = row[0];
				var name = row[1];
				var divi = row[2];
				var exdivi = row[3];
				if (!data[symbol].name) {
					data[symbol].name = name;
				}
				if (divi != '-' && divi != 'N/A') {
					data[symbol].dividend = moment(divi, FORMATS);
				}
				if (exdivi != '-' && exdivi != 'N/A') {
					data[symbol].exdividend = moment(exdivi, FORMATS);
				}
			});
			resolve(data);
		});
	});
}

function getPortfolio() {
	if (!localStorage['$portfolio']) 
		localStorage['$portfolio'] = "[]";
	return Promise.resolve(JSON.parse(localStorage['$portfolio']));
}


function StockCal(name) {
	this._name = name;
	this._items = {};
}
StockCal.prototype = {
	FORMATS: [
		"DD-MMM-YY",
		"MMM DD"
	],
	add: function(symbol) {
		this._items[symbol] = false;
	},
	_check: function() {
		if (this._feed && this._req) {
			this._req.done(this._process.bind(this));
		}
	},
	_process: function(data) {
		var events = [];
		$.csv.toArrays(data).forEach(function(row) {
			if (row.length != 4) {
				return;
			}
			var symbol = row[0];
			var name = row[1];
			var divi = row[2];
			var exdivi = row[3];
			if (divi != '-' && divi != 'N/A') {
				divi = moment(divi, this.FORMATS);
				events.push({
					title: symbol,
					full_name: name,
					start: divi.toDate(),
					className: [this._name, "dividend"],
				});
			}
			if (exdivi != '-' && exdivi != 'N/A') {
				exdivi = moment(exdivi, this.FORMATS);
				events.push({
					title: "Ex: " + symbol,
					full_name: name,
					start: exdivi.toDate(),
					className: [this._name, "exdividend"],
				});
			}
		}, this);
		this._feed(events);
	},
	finish: function() {
		var sl = Object.keys(this._items).join(',');
		if (!sl) {
			this._req = $.Deferred();
			this._req.resolve("");
			this._check();
		} else {
			// Kick off the AJAX call to Yahoo to get date data
			this._req = $.get("http://download.finance.yahoo.com/d/quotes.csv", {
				s: sl,
				f: 'snr1q0'
			})
			.fail(function() {
				// TODO
				alert("Failed to load Yahoo! Finance data");
			});
			// Register done callback if we've already been called by fullCalendar
			this._check();
		}
	},
	feeder: function(start, end, callback) {
		this._feed = callback;
		this._check();
	},
	get events() {
		return this.feeder.bind(this);
	}
};

var calendars = {
	portfolio: new StockCal("portfolio"),
	wsj: new StockCal("wsj")
};

$(function() {
	// Make the WSJ data flow
	var weakness = ProJax.get("http://online.wsj.com/mdc/public/npage/2_3045-mfgppl-mfxml2csv.html").then(parseWSJ),
		strength = ProJax.get("").then(parseWSJ);
	weakness.then(function(data) {
		displayList('#weaklist', data);
	});
	strength.then(function(data) {
		displayList('#stronglist', data);
	});
	Promise.all([weakness, strength]).then(mergeData).then(getDates).then(/*Add to calendar*/);

	// Make the Portfolio data flow
	getPortfolio().then(getDates).then(/*Add to Calendar*/);
	$('#calendar').fullCalendar({
		theme: true,
		header: {
		    left:   'title',
		    center: 'basicDay,basicWeek,month',
		    right:  'today prev,next'
		},
		weekends: false,
		eventSources: [
			calendars.wsj,
			calendars.portfolio
		],
		eventRender: function(event, element) {
	        element.attr('title', event.full_name);
	    }
	});
});