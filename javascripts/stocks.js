console.called = function(func) {
	console.groupCollapsed(func);
	Array.prototype.slice.call(arguments, 1).forEach(function(arg) {
		console.dir(arg);
	});
	console.groupEnd();
};

var ProJax = {
	get: function(url, args) {
		console.called("ProJax.get", url, args);
		return new Promise(function(resolve, reject) {
			$.get(url, args).done(resolve).fail(reject);
		});
	}
};

function parseWSJ(data) {
	console.called("parseWSJ", data);
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
	console.called("displayList", sel, data);
	var parent = $(sel);
	for(var sym in data) {
		var rec = data[sym];
		parent.append($('<li>').stock(rec.symbol, rec.name));
	}
}

function mergeData(datas) {
	console.called("mergeData", datas);
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
	console.called("getDates", data);
	return ProJax.get("http://download.finance.yahoo.com/d/quotes.csv", {
		s: Object.keys(data).join(','),
		f: 'snr1q0'
	}).then(function(dates) {
		console.called("getDates.<resolve>", dates)
		var FORMATS = [
			"DD-MMM-YY",
			"MMM DD"
		];

		$.csv.toArrays(dates).forEach(function(row, index) {
			if (row.length != 4) {
				console.debug("Not a row?");
				return;
			}
			var symbol = row[0].replace(/[-]/, '');
			var name = row[1];
			var divi = row[2];
			var exdivi = row[3];
			var rec = data[symbol];
			if (rec == undefined) {
				console.log("This shouldn't be here", row);
				return;
			}
			rec.name = name;
			if (divi != '-' && divi != 'N/A') {
				rec.dividend = moment(divi, FORMATS);
			}
			if (exdivi != '-' && exdivi != 'N/A') {
				rec.exdividend = moment(exdivi, FORMATS);
			}
		});
		return Promise.resolve(data);
	});
}

function getPortfolio() {
	console.called("getPortfolio");
	if (!localStorage['$portfolio']) 
		localStorage['$portfolio'] = "[]";
	return Promise.resolve(JSON.parse(localStorage['$portfolio']));
}

function makeEvents(name, data) {
	var events = [];
	console.called("makeEvents", data);
	for (var s in data) {
		var rec = data[s];
		if (rec.dividend) {
			events.push({
				title: rec.symbol,
				full_name: rec.name+" ("+rec.count+")",
				start: rec.dividend.toDate(),
				className: [name, "dividend", "count-"+rec.count],
			});
		}
		/*if (rec.exdividend) {
			events.push({
				title: rec.symbol,
				full_name: rec.name,
				start: rec.exdividend.toDate(),
				className: [name, "exdividend", "count-"+rec.count],
			});
		}*/
	}
	return Promise.resolve(events);
}


function StockCal(name) {
	this._name = name;
	this._items = {};
	var f = new Promise(function(resolve) {
			this._feedee = resolve;
		}.bind(this)),
		d = new Promise(function(resolve) {
			this._data = resolve;
		}.bind(this));

	Promise.all([f, d]).then(function(bits) {
		var feedee = bits[0],
			data = bits[1];
		makeEvents(this._name, data).then(feedee);
	}.bind(this));
}
StockCal.prototype = {
	resolve: function(data) {
		console.called("StockCal.resolve", data);
		this._data(data);
	},
	feeder: function(start, end, callback) {
		console.called("StockCal.feeder", start, end, callback);
		this._feedee(callback);
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
		strength = ProJax.get("http://online.wsj.com/mdc/public/npage/2_3045-mflppg-mfxml2csv.html").then(parseWSJ);
	weakness.then(function(data) {
		displayList('#weaklist', data);
	});
	strength.then(function(data) {
		displayList('#stronglist', data);
	});
	var cal_wsj = Promise.all([weakness, strength]).then(mergeData).then(getDates).then(function(data) {
		calendars.wsj.resolve(data);
	});

	// Make the Portfolio data flow
	var portfolio = getPortfolio().then(getDates)
	portfolio.then(function(data) {
		displayList('#portfolio', data);
	});
	var cal_port = portfolio.then(function(data) {
		calendars.portfolio.resolve(data);
	});

	Promise.all([cal_wsj, cal_port]).then(function() {
		console.debug("All data loaded!");
	})

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