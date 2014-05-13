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
					title: name + " (" + symbol + ")",
					start: divi,
					className: [this._name, "dividend"],
				});
			}
			if (exdivi != '-' && exdivi != 'N/A') {
				exdivi = moment(exdivi, this.FORMATS);
				events.push({
					title: "Ex: " + name + " (" + symbol + ")",
					start: exdivi,
					className: [this._name, "exdividend"],
				});
			}
		}, this);
		this._feed(events);
	},
	finish: function() {
		var sl = Object.keys(this._items).join(',');
		if (!sl) return;
		// Kick off the AJAX call to Yahoo to get date data
		this._req = $.get("http://download.finance.yahoo.com/d/quotes.csv", {
			s: sl,
			f: 'snr1q0'
		});
		// Register done callback if we've already been called by fullCalendar
		this._check();
	},
	feeder: function(start, end, callback) {
		this._feed = callback;
		this._check();
	},
	getFeeder: function() {
		return this.feeder.bind(this);
	}
};

var calendars = {
	portfolio: new StockCal("portfolio"),
	wsj: new StockCal("wsj")
};

function loadWSJ() {
	$.get("http://online.wsj.com/mdc/public/npage/2_3045-mfgppl-mfxml2csv.html")
	.done(function(data) {
		var parent = $('#weaklist');
		$.csv.toArrays(data, {separator: '\t'}).forEach(function(row) {
			var matches;
			if (matches = /(.*) \((.*)\)/.exec(row[0])) {
				parent.append($('<li>').stock(matches[2], matches[1]));
				calendars.wsj.add(matches[2]);
			}
		});
		calendars.wsj.finish();
	})
	.fail(function (){
		// TODO
	})
	;
}

function loadPortfolio() {
	if (!localStorage['$portfolio']) localStorage['$portfolio'] = "[]";
	var syms = JSON.parse(localStorage['$portfolio']);
	if (syms) {
		var parent = $('#portfolio');
		syms.forEach(function(e) {
			parent.append($('<li>').stock(e));
			calendars.portfolio.add(e);
		});
	}
	calendars.portfolio.finish();
}

$(function() {
	loadWSJ();
	loadPortfolio();
	$('#calendar').fullCalendar({
		eventSources: [
			{
				events: calendars.portfolio.getFeeder(),
				color: 'green',
				textColor: 'black'
			},
			{
				events: calendars.wsj.getFeeder(),
				color: 'blue',
				textColor: 'black'
			}
		]
	})
});