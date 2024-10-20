import React, { useState, useEffect, useRef } from 'react';
import './index.css';

const TradingViewChart = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('BINANCE:ETHUSDT');
  const [selectedInterval, setSelectedInterval] = useState('1');
  const [chartData, setChartData] = useState([]);
  const wsRef = useRef(null);

  // Dynamically load TradingView script
  useEffect(() => {
    if (!window.TradingView) {
      const script = document.createElement('script');
      script.src = "https://s3.tradingview.com/tv.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Load data from localStorage for the selected symbol
  useEffect(() => {
    const storedData = localStorage.getItem(selectedSymbol);
    if (storedData) {
      setChartData(JSON.parse(storedData)); // Load from localStorage
    } else {
      setChartData([]); // Initialize with empty data if no stored data
    }
  }, [selectedSymbol]);

  // Initialize TradingView widget with updated data
  useEffect(() => {
    if (window.TradingView) {
      new window.TradingView.widget({
        container_id: "tradingview_widget",
        width: "100%",
        height: "500px",
        symbol: selectedSymbol,
        interval: selectedInterval,
        theme: "light",
        style: "1",
        locale: "en",
        toolbar_bg: "#f1f3f6",
        allow_symbol_change: true,
      });
    }
  }, [selectedSymbol, selectedInterval, chartData]);

  // Handle WebSocket connection and real-time updates
  useEffect(() => {
    const handleWebSocket = () => {
      if (wsRef.current) wsRef.current.close(); // Close previous WebSocket connection

      const wsUrl = `wss://stream.binance.com:9443/ws/${selectedSymbol.toLowerCase()}@kline_${selectedInterval}`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onmessage = (event) => {
        const { t, o, h, l, c } = JSON.parse(event.data).k;
        const candle = { t, o: +o, h: +h, l: +l, c: +c };

        // Update chart data and store the combined data in localStorage
        setChartData((prevData) => {
          const updatedData = [...prevData, candle].slice(-50); // Keep last 50 entries
          localStorage.setItem(selectedSymbol, JSON.stringify(updatedData)); // Store updated data
          return updatedData;
        });
      };

      wsRef.current.onclose = () => console.log('WebSocket closed');
    };

    handleWebSocket();
    return () => wsRef.current && wsRef.current.close();
  }, [selectedSymbol, selectedInterval]);
  
  return (
    <div className="app">
      <h1>Binance Market Data</h1>

      {/* Dropdown cryptocurrency */}
      <div className="controls">
        <label>Crypto Currency:</label>
        <select onChange={(e) => setSelectedSymbol(`BINANCE:${e.target.value}`)}>
          <option value="ETHUSDT">ETH / USDT</option>
          <option value="BNBUSDT">BNB / USDT</option>
          <option value="DOTUSDT">DOT / USDT</option>
        </select>

        {/* Dropdown  interval */}
        <label>Interval:</label>
        <select onChange={(e) => setSelectedInterval(e.target.value)}>
          <option value="1">1 Minute</option>
          <option value="3">3 Minutes</option>
          <option value="5">5 Minutes</option>
        </select>
      </div>

      {/* TradingView widget container */}
      <div id="tradingview_widget"></div>
    </div>
  );
};

export default TradingViewChart
