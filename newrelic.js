'use strict';

exports.config = {
  app_name: ['monarch-backend'], // Replace with your application's name
  license_key: '12fd92eabef470e7cc3b297e9103f350FFFFNRAL', // Replace with your New Relic license key
  logging: {
    level: 'info', // Adjust the log level as needed (info, warn, error, etc.)
    filepath: 'stdout', // Log to stdout (console)
  },
  allow_all_headers: true,
  attributes: {
    // Add any custom attributes you want to capture with each transaction
    custom_key: 'custom_value',
  },
  error_collector: {
    enabled: true,
  },
  transaction_tracer: {
    enabled: true,
  },
  application_logging: {
    forwarding: {
      enabled: true,
    },
    // local_decorating: {
    //   enabled: true
    // }
  },
  browser_monitoring: {
    enable: true,
  },
};
