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
	this._feedee = new Promise();
	this._data = new Promise();

	Promise.all([this._feedee, this._data]).then(function(bits) {
		var events = [],
			feedee = bits[0],
			data = bits[1];
		for (var s in data) {
			var rec = data[s];
			if (rec.dividend) {
				events.push({
					title: rec.symbol,
					full_name: rec.name,
					start: rec.dividend.toDate(),
					className: [this._name, "dividend", "count-"+rec.count],
				});
			}
			if (rec.exdividend) {
				events.push({
					title: rec.symbol,
					full_name: rec.name,
					start: rec.exdividend.toDate(),
					className: [this._name, "exdividend", "count-"+rec.count],
				});
			}
		}
	});
}
StockCal.prototype = {
	resolve: function(data) {
		this._data.resolve(data);
	}
	feeder: function(start, end, callback) {
		this._feedee.resolve(callback);
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
	Promise.all([weakness, strength]).then(mergeData).then(getDates).then(function(data) {
		calendasr.wsj.resolve(data);
	});

	// Make the Portfolio data flow
	getPortfolio().then(getDates).then(function(data) {
		calendars.portfolio.resolve(data);
	});

	// Make the calendar
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