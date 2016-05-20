//https://forums.meteor.com/t/connecting-2-apps-over-ddp-how-to-login-across/977

RemoteDDP = {};

if (typeof Accounts !== 'undefined') {
  throw new Error("remote-ddp is loaded after accounts-base. Make remote-ddp load before " +
    "accounts-base by placing it earlier in your .meteor/packages file.");
}

/**
 * Monkey-patch everything that we can think of with the new connection.
 *
 * @returns {Connection} - The DDP connection.
 */
RemoteDDP.monkeyPatch = function () {
  // If accounts-base is loaded, then we told it to use our URL and it created a connection
  // that we should use.
  var connection = DDP.connect(Meteor.settings.public.remoteDdpUrl);

  // Meteor.setInterval(() => {
  //   console.log(connection.status());
  // }, 5000);

  // connection.onReconnect = function () {
  //   console.log('Meteor.remoteConnection.onReconnect', arguments);
  // }

  // Replace base connection.
  Accounts.connection = connection;
  Meteor.connection = connection;
  Accounts.users = new Mongo.Collection("users", connection);
  Meteor.users = Accounts.users;

  // Patch methods
  var methods = ["subscribe", "call", "apply", "methods", "status", "reconnect", "disconnect", "onReconnect"];
  methods.forEach(function (method) {
    Meteor[method] = function () {
      return connection[method].apply(connection, arguments);
    };
  });

  Tracker.autorun(function () {
    var user = Meteor.user();
    if (user) {
      // using u2622:persistent-session
      Session.set('_storedLoginToken', Accounts._storedLoginToken(), true);
    }
  });

  return connection;
}