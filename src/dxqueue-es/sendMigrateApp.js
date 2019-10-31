importClass(Packages.com.novell.nds.dhutil.JCHelper);
importClass(Packages.com.novell.nds.dirxml.driver.Trace);
importClass(Packages.com.novell.nds.dirxml.engine.MiscDS);
importClass(Packages.com.novell.nds.dirxml.engine.ThreadGroupVars);
importClass(Packages.com.novell.nds.dirxml.util.DxWire);
importClass(Packages.com.novell.nds.dirxml.engine.NdsDtd);
importClass(Packages.com.novell.nds.dirxml.engine.XdsUtil);

importClass(Packages.com.novell.nds.dirxml.engine.OperationData);
importClass(Packages.com.novell.xml.dom.DOMQuery);
importClass(Packages.com.novell.xml.dom.DOMWriter);
importClass(Packages.novell.jclient.JCContext);
importClass(Packages.novell.jclient.JCException);
importClass(Packages.novell.jclient.JClient);
importClass(java.io.StringWriter);

var debugPrefix = 'sendQueueEvent: ';

function serializeEx(doc, indent) {
    // 
    //requires: java.io.StringWriter
    //requires: com.novell.xml.dom.DOMWriter
    indent = "undefined" !== typeof indent ? !!indent : !0;
    var sw = new StringWriter;
    dw = new DOMWriter(doc, sw);
    dw.setIndent(!!indent);
    dw.write();
    return sw.toString();
}


function debugMessage(message, level) {
    //
    //requires: com.novell.nds.dirxml.driver.Trace
    //requires: com.novell.nds.dirxml.engine.DirXML
    //requires: javax.swing.JOptionPane

    //default trace level of 1
    level = 'undefined' !== typeof level ? level : 1;

    if (message) {
        msgString = message.toString()
        if (Packages.com.novell.nds.dirxml.engine.DirXML.isExternal()) {
            Packages.javax.swing.JOptionPane.showMessageDialog(null, debugPrefix + ' ' + msgString);
        } else {
            (new Packages.com.novell.nds.dirxml.driver.Trace(debugPrefix))
                .trace(msgString, level);
        }
    }
}

function skeletonXDS(contextNode) {
    // this function generates a skeleton XDS (default of input, but can be overriden)
    // returns XDS document: Document doc
    //
    //requires: com.novell.nds.dirxml.engine.NdsDtd;
    // function debugMessage
    contextNode = 'undefined' !== typeof contextNode ? contextNode : 'input';
    debugMessage('Creating skeleton using context: ' + contextNode);
    return NdsDtd.createDoc(contextNode)
}
function properXDS(doc) {
    // accepts:
    // either an XDS fragment or an entire XDS doc
    // it wraps the former in an XDS doc as necessary

    // returns: 
    // XDS document: Document doc
    //
    // note:
    // will return empty XDS document when input is empty
    //
    //requires: com.novell.nds.dirxml.engine.NdsDtd;
    //requires: com.novell.nds.dirxml.engine.XdsUtil;

    // generate empty empty XDS document.

    var docRet = skeletonXDS();

    // will return empty XDS document when input is empty
    if (null != doc.first()) {

        var rootDocNode = ((null == doc.first()
            .getOwnerDocument()) ? doc.first() : doc.first()
                .getOwnerDocument())
            .getDocumentElement()

        var rootNodeName = rootDocNode.getNodeName()
        // Returning unchanged if no re-wrapping is required.
        if (null != rootDocNode && rootNodeName.equals('nds')) {
            debugMessage('Returning supplied XDS unchanged, already proper XDS')
            return doc;
        }
        if (null != rootDocNode && rootNodeName.matches('add|modify|modify-password|query|query-ex|rename|move|delete|trigger|sync')) {
            // Merging supplied XDS with wrapper
            debugMessage('Merging supplied XDS with wrapper: ' + rootNodeName)
            Packages.com.novell.nds.dirxml.engine.XdsUtil.graftSubtree(docRet, rootDocNode);
        } else {
            debugMessage('Invalid document: ' + rootNodeName + 'is not supported.')
            return docRet
        }

    }
    return docRet.getOwnerDocument().getDocumentElement();
}

function sendMigrateApp(driverDN, myElement) {
    // this function takes either a command (query/query-ex) or an entire XDS doc
    // if necessary, it wraps the command in an XDS doc.
    // returns status document: Document doc
    // requires: com.novell.nds.dhutil.JCHelper
    // requires: com.novell.nds.dirxml.engine.MiscDS
    // requires: com.novell.nds.dirxml.engine.ThreadGroupVars
    // requires: com.novell.nds.dirxml.util.DxWire
    // requires: com.novell.nds.dirxml.engine.DirXML
    // requires: com.novell.nds.dirxml.engine.NdsDtd
    // requires: com.novell.xml.dom.DOMQuery.query
    // requires: com.novell.xml.dom.DOMWriter
    // requires: java.io.StringWriter
    // requires: novell.jclient.JCContext
    // requires: novell.jclient.JCException
    // requires: novell.jclient.JClient
    // requires: java.lang.*
    // requires: java.nio.charset.StandardCharsets
    // function debugMessage
    // function properXDS
    // skeletonXDS
    if (!(Packages.com.novell.nds.dirxml.engine.DirXML.isExternal())) {
        try {
            debugMessage('Cleaning up supplied XDS');

            var theElement = properXDS(myElement);
            (theElement === myElement) ? debugMessage('Passthru XDS as-is') : debugMessage('Cleaned up XDS')
            //debugMessage('Detected theElement: ' + theElement)
            var myEncoding = java.nio.charset.StandardCharsets.UTF_8;
            debugMessage('Validating document')

            try {
                if (null == rootDoc) {
                    var rootDoc = theElement.first().getFirstChild().getOwnerDocument()
                }
            } catch (e) {debugMessage('First node not found, falling back to first alternate mechanism')}
            try {
                if (null == rootDoc) {
                    var rootDoc = theElement.getFirstChild().getOwnerDocument()
                }
            } catch (e) { debugMessage('First node not found, falling back to second alternate mechanism' + e) }
            try {
                if (null == rootDoc) {
                    var rootDoc = theElement.first().getOwnerDocument()
                }
            } catch (e) { debugMessage('error' + e)}
            if (null == rootDoc) {
                debugMessage('Trying built-in getOwnerDocument() method as last resort');
                var rootDoc = theElement.getOwnerDocument()
            }
            
            try { rootNodeName = rootDoc.getNodeName(); } catch (e) { debugMessage('error' + e) }
            try {
                if (null == myOps) {
                    var myOps = Packages.com.novell.xml.dom.DOMQuery.query(rootDoc, "//input/*");
                }
            } catch (e) { debugMessage(e) }

            if (null == myOps.first()) {
                return NdsDtd.createStatusDocument((new java.lang.Integer(2)), null, 'Nothing to submit!')
                    .getDocumentElement()
            }
            if (myOps.first().getLocalName().matches('query|query-ex')){
                debugMessage('Detected command: ' + myOps.first().getLocalName())
            }
            
            else { 
            return NdsDtd.createStatusDocument((new java.lang.Integer(2)), null, ('command:' + myOps.first().getLocalName() + 'Not valid for this function'))
                    .getDocumentElement()
            }


            debugMessage('Serializing document to ByteArray with encoding: ' + myEncoding)
            var serializedDoc = serializeEx(rootDoc, false)
            bytes = serializedDoc.getBytes(myEncoding);

            if (null == bytes) {
                return NdsDtd.createStatusDocument((new java.lang.Integer(3)), null, 'XDS could not be converted to ByteArray!')
                    .getDocumentElement()
            }
            var opdata = new OperationData(null);
            treeName = MiscDS.getTreeName();
            debugMessage('Detected tree name: ' + treeName);
            var context = new Packages.novell.jclient.JCContext(0, treeName, "00.\\+=*'");
            JCHelper.loginAsServer(context);
            debugMessage('Attempting to authenticate to tree');
            context.authenticate();
            var currentDriverDN = ThreadGroupVars.get("vrDriverDN");
            debugMessage('Verifying access to: ' + currentDriverDN);
            if (null == currentDriverDN) {
                throw new JCException("getEffectivePriviledges()", -672);
            }
            if (!(driverDN.startsWith("\\"))) {
                debugMessage('Converting ' + driverDN + ' to absolute path...');
                driverDN = '\\' + treeName + '\\' + driverDN;
            }

            debugMessage('Verifying access to: ' + currentDriverDN);
            context.nameToID(1, driverDN);
            if ((context.getEffectivePrivileges(currentDriverDN, "[Entry Rights]") & 0x10) == (new java.lang.Long(0))) {
                throw new JCException("getEffectivePriviledges()", -672);
            }

            debugMessage('MigrateApp with supplied XDS');
            var wireCtor = new Packages.com.novell.nds.dirxml.util.DxWire();
            wireCtor.setDnFormat(0);
            result = sendWireRequest(context, wireCtor.constructMigrateApp(driverDN, bytes));
            output = NdsDtd.createStatusDocument((new java.lang.Integer(0)), null, 'Submitted migrate app query to subscriber channel on driver: ' + currentDriverDN)
                .getDocumentElement()

        } catch (t) {
            return NdsDtd.createStatusDocument((new java.lang.Integer(0)), opdata, 'Error: ' + t)
                .getDocumentElement()
        } finally {
            if (context != null) {
                context.free();
            }
        }
    }
    return output;

    function sendWireRequest(context, wireData) {
        replyBuffer = new java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, wireData.getResponseSize())
        replySize = JClient.ndsRequest(context, wireData.getVerb(), wireData.getRequestData()
            .length, wireData.getRequestData(), replyBuffer.length, replyBuffer);
        if (0 == replySize) {
            return null;
        }
        else if (replySize != replyBuffer.length) {
            temp = new java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, replySize)
            Java.lang.System.arraycopy(replyBuffer, 0, temp, 0, replySize);
            replyBuffer = temp;
        }
        return replyBuffer;
    }
}