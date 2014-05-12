from django.db import models


class Stock(models.Model):
    symbol = models.CharField(max_length=16, primary_key=True)

    def get_absolute_url(self):
        pass


class Entry(models.Model):
    stock = models.ForeignKey(Stock)
    when = models.DateTimeField(audo_now_add=True)

    AfterHoursChangeRealtime
    AnnualizedGain
    Ask
    AskRealtime
    AskSize
    AverageDailyVolume
    Bid
    BidRealtime
    BidSize
    BookValuePerShare
    Change
    Change_ChangeInPercent
    ChangeFromFiftydayMovingAverage
    ChangeFromTwoHundreddayMovingAverage
    ChangeFromYearHigh
    ChangeFromYearLow
    ChangeInPercent
    ChangeInPercentRealtime
    ChangeRealtime
    Commission
    Currency
    DaysHigh
    DaysLow
    DaysRange
    DaysRangeRealtime
    DaysValueChange
    DaysValueChangeRealtime
    DividendPayDate
    TrailingAnnualDividendYield
    TrailingAnnualDividendYieldInPercent
    DilutedEPS
    EBITDA
    EPSEstimateCurrentYear
    EPSEstimateNextQuarter
    EPSEstimateNextYear
    ExDividendDate
    FiftydayMovingAverage
    SharesFloat
    HighLimit
    HoldingsGain
    HoldingsGainPercent
    HoldingsGainPercentRealtime
    HoldingsGainRealtime
    HoldingsValue
    HoldingsValueRealtime
    LastTradeDate
    LastTradePriceOnly
    LastTradeRealtimeWithTime
    LastTradeSize
    LastTradeTime
    LastTradeWithTime
    LowLimit
    MarketCapitalization
    MarketCapRealtime
    MoreInfo
    Name
    Notes
    OneyrTargetPrice
    Open
    OrderBookRealtime
    PEGRatio
    PERatio
    PERatioRealtime
    PercentChangeFromFiftydayMovingAverage
    PercentChangeFromTwoHundreddayMovingAverage
    ChangeInPercentFromYearHigh
    PercentChangeFromYearLow
    PreviousClose
    PriceBook
    PriceEPSEstimateCurrentYear
    PriceEPSEstimateNextYear
    PricePaid
    PriceSales
    Revenue
    SharesOwned
    SharesOutstanding
    ShortRatio
    StockExchange
    Symbol
    TickerTrend
    TradeDate
    TradeLinks
    TradeLinksAdditional
    TwoHundreddayMovingAverage
    Volume
    YearHigh
    YearLow
    YearRange

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
        'YearRange': 'w0'
        }

    class Meta:
        unique_together = (
            ("stock", "when"),
            )