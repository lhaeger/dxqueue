# dxqueue
A helper class to queue XDS events into a Micro Focus Identity Manager driver cache

Initially developed by Peter Lambrechtsen and published at https://community.microfocus.com/t5/Identity-Manager-Tips/Sending-a-XDS-Message-from-one-driver-to-another/ta-p/1777175 , this version fixes a few bugs and adds javadocs.

If a supplied document is only a command and lacks the complete nds wrapper, a wrapper will be added.
Includes support for injecting both regular "add/modify" events and also "migrate into Identity Vault" style queries.

# dxqueue-es

This version is a port of the code to ECMAScript and adds more robust validation.


There are minor differences between the internal pre-validation of DOM documents. In the ECMAScript version, all attempts are made to try and ensure that invalid documents are not queued. Instead an error message is returned.
This is to prevent crashing or hanging of the engine. Also the ECMAScript version, one can pass a document where the operation/element node is the root of the documet and it will be accepted.

Also The JAR version expects that you select pass a child of the root node.

## sendQueueEvent
Support for queueing "add/modify" style operations.

The JAR version is called from the defined namespace.
    dxqueue:sendQueueEvent(java.lang.String driverDN, org.w3c.dom.Element element) 

The ECMAScript version is a drop-in replacement for the Java helper class, with identical calling syntax.
Any well formed operation, including driver-specific operations and namespaces can be queued.

    es:sendQueueEvent(java.lang.String driverDN, org.w3c.dom.Element element)


## sendMigrateApp
Support for queueing "migrate into Identity Vault" style queries.

The JAR version is called from the defined namespace.
    dxqueue:sendMigrateApp(java.lang.String driverDN, org.w3c.dom.Element element) 

The ECMAScript version is a drop-in replacement for the Java helper class, with identical calling syntax.

Only query or query-ex operations can be queued.

    es:sendMigrateApp(java.lang.String driverDN, org.w3c.dom.Element element) 



If you want to suppport this project [buy me a coffee](https://www.buymeacoffee.com/lhaeger)!
