"""
Demo module to play with the Yahoo API.
"""
import requests
import csv
import re
from requests.compat import urlencode
from decimal import Decimal

COLUMNS = {
    'AfterHoursChangeRealtime': 'c8',
    'AnnualizedGain': 'g3',
    'Ask': 'a0',
    'AskRealtime': 'b2',
    'AskSize': 'a5',
    'AverageDailyVolume': 'a2',
    'Bid': 'b0',
    'BidRealtime': 'b3',
    'BidSize': 'b6',
    'BookValuePerShare': 'b4',
    'Change': 'c1',
    'ChangeFromFiftydayMovingAverage': 'm7',
    'ChangeFromTwoHundreddayMovingAverage': 'm5',
    'ChangeFromYearHigh': 'k4',
    'ChangeFromYearLow': 'j5',
    'ChangeInPercent': 'p2',
    'ChangeInPercentFromYearHigh': 'k5',
    'ChangeInPercentRealtime': 'k2',
    'ChangeRealtime': 'c6',
    'Change_ChangeInPercent': 'c0',
    'Commission': 'c3',
    'Currency': 'c4',
    'DaysHigh': 'h0',
    'DaysLow': 'g0',
    'DaysRange': 'm0',
    'DaysRangeRealtime': 'm2',
    'DaysValueChange': 'w1',
    'DaysValueChangeRealtime': 'w4',
    'DilutedEPS': 'e0',
    'DividendPayDate': 'r1',
    'EBITDA': 'j4',
    'EPSEstimateCurrentYear': 'e7',
    'EPSEstimateNextQuarter': 'e9',
    'EPSEstimateNextYear': 'e8',
    'ExDividendDate': 'q0',
    'FiftydayMovingAverage': 'm3',
    'HighLimit': 'l2',
    'HoldingsGain': 'g4',
    'HoldingsGainPercent': 'g1',
    'HoldingsGainPercentRealtime': 'g5',
    'HoldingsGainRealtime': 'g6',
    'HoldingsValue': 'v1',
    'HoldingsValueRealtime': 'v7',
    'LastTradeDate': 'd1',
    'LastTradePriceOnly': 'l1',
    'LastTradeRealtimeWithTime': 'k1',
    'LastTradeSize': 'k3',
    'LastTradeTime': 't1',
    'LastTradeWithTime': 'l0',
    'LowLimit': 'l3',
    'MarketCapRealtime': 'j3',
    'MarketCapitalization': 'j1',
    'MoreInfo': 'i0',
    'Name': 'n0',
    'Notes': 'n4',
    'OneyrTargetPrice': 't8',
    'Open': 'o0',
    'OrderBookRealtime': 'i5',
    'PEGRatio': 'r5',
    'PERatio': 'r0',
    'PERatioRealtime': 'r2',
    'PercentChangeFromFiftydayMovingAverage': 'm8',
    'PercentChangeFromTwoHundreddayMovingAverage': 'm6',
    'PercentChangeFromYearLow': 'j6',
    'PreviousClose': 'p0',
    'PriceBook': 'p6',
    'PriceEPSEstimateCurrentYear': 'r6',
    'PriceEPSEstimateNextYear': 'r7',
    'PricePaid': 'p1',
    'PriceSales': 'p5',
    'Revenue': 's6',
    'SharesFloat': 'f6',
    'SharesOutstanding': 'j2',
    'SharesOwned': 's1',
    'ShortRatio': 's7',
    'StockExchange': 'x0',
    'Symbol': 's0',
    'TickerTrend': 't7',
    'TradeDate': 'd2',
    'TradeLinks': 't6',
    'TradeLinksAdditional': 'f0',
    'TrailingAnnualDividendYield': 'd0',
    'TrailingAnnualDividendYieldInPercent': 'y0',
    'TwoHundreddayMovingAverage': 'm4',
    'Volume': 'v0',
    'YearHigh': 'k0',
    'YearLow': 'j0',
    'YearRange': 'w0',
}

# These columns are known to be misformatted on Yahoo's side.
# Specifically, they're numbers that are formatted with commas without quoting
PROBLEM_COLUMNS = {
    'SharesFloat',
    'SharesOutstanding',
}


def yNoneOr(cls):
    def _(v):
        if v in ('-', 'N/A'):
            return None
        else:
            return cls(v)


def percent(v):
    if v.endswith('%'):
        v = v[:-1]
    return Decimal(v) / 100


def change_np(v):
    """<change amount> - <change percent>
    """
    return NotImplemented


def range_nn(v):
    """<low num> - <high num>
    """
    return NotImplemented


def datething(v):
    return NotImplemented


def timeonly(v):
    return NotImplemented


def suffixed_n(v):
    """
    Deals in approximate numbers: B, M, k, etc
    """
    return NotImplemented


def html(v):
    unicode(v)


COLUMN_MAPS = {
    # 'AfterHoursChangeRealtime': 'N/A - N/A',
    'AnnualizedGain': Decimal,
    'Ask': Decimal,
    'AskRealtime': Decimal,
    'AskSize': int,
    'AverageDailyVolume': int,
    'Bid': Decimal,
    'BidRealtime': Decimal,
    'BidSize': int,
    'BookValuePerShare': Decimal,
    'Change': Decimal,
    'ChangeFromFiftydayMovingAverage': Decimal,
    'ChangeFromTwoHundreddayMovingAverage': Decimal,
    'ChangeFromYearHigh': Decimal,
    'ChangeFromYearLow': Decimal,
    'ChangeInPercent': percent,
    'ChangeInPercentFromYearHigh': percent,
    'ChangeInPercentRealtime': change_np,
    'ChangeRealtime': Decimal,
    'Change_ChangeInPercent': change_np,
    # 'Commission': TODO,
    # 'Currency': 'USD',
    'DaysHigh': Decimal,
    'DaysLow': Decimal,
    'DaysRange': range_nn,
    'DaysRangeRealtime': range_nn,  # XXX: Is this correct?
    'DaysValueChange': change_np,
    'DaysValueChangeRealtime': change_np,  # XXX
    'DilutedEPS': Decimal,
    'DividendPayDate': datething,
    'EBITDA': suffixed_n,
    'EPSEstimateCurrentYear': Decimal,
    'EPSEstimateNextQuarter': Decimal,
    'EPSEstimateNextYear': Decimal,
    'ExDividendDate': datething,
    'FiftydayMovingAverage': Decimal,
    # 'HighLimit': '-', TODO
    # 'HoldingsGain': '-', TODO
    # 'HoldingsGainPercent': '- - -', TODO
    # 'HoldingsGainPercentRealtime': 'N/A - N/A', TODO
    # 'HoldingsGainRealtime': 'N/A', TODO
    # 'HoldingsValue': '-', TODO
    # 'HoldingsValueRealtime': 'N/A', TODO
    'LastTradeDate': datething,
    'LastTradePriceOnly': Decimal,
    # 'LastTradeRealtimeWithTime': 'N/A - <b>518.73</b>', TODO
    'LastTradeSize': int,
    'LastTradeTime': timeonly,
    # 'LastTradeWithTime': 'May  9 - <b>518.73</b>', TODO Same as LastTradeRealtimeWithTime
    # 'LowLimit': '-', TODO
    # 'MarketCapRealtime': 'N/A', TODO
    'MarketCapitalization': suffixed_n,
    # 'MoreInfo': 'npmiIed',
    # 'Name': 'Google Inc.',
    # 'Notes': '-', TODO
    # 'OneyrTargetPrice': 'N/A', TODO
    'Open': Decimal,
    # 'OrderBookRealtime': 'N/A', TODO
    # 'PEGRatio': 'N/A', TODO
    'PERatio': Decimal,
    'PERatioRealtime': Decimal,
    'PercentChangeFromFiftydayMovingAverage': percent,
    'PercentChangeFromTwoHundreddayMovingAverage': percent,
    'PercentChangeFromYearLow': percent,
    'PreviousClose': Decimal,
    'PriceBook': Decimal,
    # 'PriceEPSEstimateCurrentYear': 'N/A', TODO
    # 'PriceEPSEstimateNextYear': 'N/A', TODO
    # 'PricePaid': '-',
    'PriceSales': Decimal,
    'Revenue': suffixed_n,
    'SharesFloat': int,
    'SharesOutstanding': int,
    # 'SharesOwned': '-', TODO
    'ShortRatio': Decimal,
    # 'StockExchange': 'NasdaqNM',
    # 'Symbol': 'GOOG',
    'TickerTrend': html,
    # 'TradeDate': '-', TODO
    'TradeLinks': html,
    'TradeLinksAdditional': html,
    'TrailingAnnualDividendYield': Decimal,
    # 'TrailingAnnualDividendYieldInPercent': 'N/A', TODO
    'TwoHundreddayMovingAverage': Decimal,
    'Volume': int,
    'YearHigh': Decimal,
    'YearLow': Decimal,
    'YearRange': range_nn
}


def getyql(*symbols):
    """
    Just asks YQL.

    Only a limited number of columns.
    """
    QUERY = \
        "select * from yahoo.finance.quoteslist where symbol in ({})".format(
            ', '.join('@s{}'.format(n) for n in range(len(symbols)))
            )
    data = requests.get(
        "https://query.yahooapis.com/v1/public/yql",
        params=dict(
            q=QUERY,
            format="json",
            env='store://datatables.org/alltableswithkeys',
            **{"s{}".format(n): s for n, s in enumerate(symbols)}
        ),
        )
    for row in data.json()['query']['results']['quote']:
        yield row


def getycsv(*symbols):
    """
    Asks YQL to parse the CSV.

    Silent CSV parse errors.
    """
    cols, abbrs = zip(*COLUMNS.items())
    QUERY = \
        "select * from csv where url=@url and columns='{}'".format(
            ','.join(cols)
            )
    data = requests.get(
        "https://query.yahooapis.com/v1/public/yql",
        params=dict(
            q=QUERY,
            format="json",
            diagnostics='true',
            url="http://download.finance.yahoo.com/d/quotes.csv?" +
                urlencode({
                    's': ','.join(symbols),
                    'f': ''.join(abbrs),
                })
        ),
        )
    for row in data.json()['query']['results']['quote']:
        yield row


def _getrows(symbols, cols):
    data = requests.get(
        "http://download.finance.yahoo.com/d/quotes.csv",
        params={
            's': ','.join(symbols),
            'f': ''.join(map(COLUMNS.__getitem__, cols)),
        }
        )
    yield from csv.reader([data.text])


def testCols(symbol):
    """
    Helps us find problem columns
    """
    for col in COLUMNS:
        for row in _getrows([symbol], [col]):
            if len(row) != 1:
                print("{}\t{}\t{}".format(col, len(row), row))


def buffer_flush(seq, first):
    """buffer_flush(iterable, callable) -> list, ...
    Breaks up an iterable based on a predicate: If true, break before that item.
    """
    buf = []
    for i in seq:
        if first(i) and len(buf):
            yield buf
            buf = []
        buf.append(i)
    yield buf


def ychain(v, funcs):
    if v in ('-', 'N/A'):
        return
    elif funcs is None:
        return v
    elif callable(funcs):
        return funcs(v)
    else:
        for f in funcs:
            v = f(v)
        return v


def getcsv(*symbols, cols=...):
    """
    Parses CSV locally.

    Still working on how to work around unquoted commas.
    """
    if cols is ...:
        cols = COLUMNS.keys()
    # Seperate problem columns
    cols = list(cols)
    pcols = []
    pcols = [c for c in cols if c in PROBLEM_COLUMNS]
    gcols = [c for c in cols if c not in PROBLEM_COLUMNS]
    # Perform the request
    data = requests.get(
        "http://download.finance.yahoo.com/d/quotes.csv",
        params={
            's': ','.join(symbols),
            # Put problem columns at the end so we can parse them special
            'f': ''.join(map(COLUMNS.__getitem__, gcols+pcols)),
        }
        )
    # Parse the results
    if not data.ok:
        raise Exception(data)  # FIXME: Figure out the correct exception(s) to use
    for row in csv.reader([data.text]):
        assert len(row) >= len(gcols) + len(pcols)
        gdata = row[:len(gcols)]
        pdata = row[len(gcols):]
        # Parse apart problem columns. White space in front means that it's a new column
        betterdata = [
            ''.join(d)
            for d in buffer_flush(pdata, first=lambda d: d.startswith(' '))
            ]
        assert len(betterdata) == len(pcols), pdata

        yield {
            k: ychain(v, COLUMN_MAPS.get(k))
            for k, v in zip(gcols+pcols, gdata+betterdata)
            }
