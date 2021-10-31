# dxqueue
A helper class to queue XDS events into a Micro Focus Identity Manager driver cache

Initially developed by Peter Lambrechtsen and published at https://community.microfocus.com/t5/Identity-Manager-Tips/Sending-a-XDS-Message-from-one-driver-to-another/ta-p/1777175 , this version fixes a few bugs and adds javadocs.

If a supplied document is only a command and lacks the nds wrapper, a wrapper will be added.

# dxqueue-es

This version is a port of the code to ECMAScript and adds more robust validation.

There are minor differences between the internal pre-validation of DOM documents. In the ECMAScript version, all attempts are made to try and ensure that invalid documents are not queued. Instead an error message is returned. This is to prevent crashing or hanging of the engine.

## sendQueueEvent
The ECMAScript version is a drop-in replacement for the Java helper class, with identical calling syntax.
Any well formed operation, including driver-specific operations and namespaces can be queued.

    es:sendQueueEvent(java.lang.String driverDN, org.w3c.dom.Element element)


## sendMigrateApp
The ECMAScript version also adds support for queueing "migrate into Identity Vault" style queries.
Only query or query-ex operations can be queued.

    es:sendMigrateApp(java.lang.String driverDN, org.w3c.dom.Element element) 
