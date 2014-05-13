function StockCal() {
	this._items = {};
}
StockCal.prototype = {
	add: function(symbol) {
		this._items[symbol] = '...';
	},
	finish: function() {
		// Kick off the AJAX call to Yahoo to get date data
		// Register done callback if we've already been called by fullCalendar
	},
	feeder: function(start, end, callback) {
		// If we have an AJAX call, register with it
		// If not, file callback away to be registered later
	},
	getFeeder: function() {
		return this.feeder.bind(this);
	}
};

var calendars = {
	portfolio: new StockCal,
	wsj: new StockCal
};

function loadWSJ() {
	$.get("http://online.wsj.com/mdc/public/npage/2_3045-mfgppl-mfxml2csv.html")
	.done(function(data) {
		var parent = $('#weaklist');
		$.csv.toArrays(data, {separator: '\t'}).forEach(function(row) {
			var matches;
			if (matches = /(.*) \((.*)\)/.exec(row[0])) {
				parent.append($('<li>').stock(matches[2], matches[1]));
			}
		});
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
		});
	}
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