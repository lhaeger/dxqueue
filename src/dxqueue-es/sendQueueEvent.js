importClass(Packages.com.novell.nds.dhutil.JCHelper);
importClass(Packages.com.novell.nds.dirxml.driver.Trace);
importClass(Packages.com.novell.nds.dirxml.engine.MiscDS);
importClass(Packages.com.novell.nds.dirxml.engine.ThreadGroupVars);
importClass(Packages.com.novell.nds.dirxml.engine.NdsDtd);
importClass(Packages.com.novell.nds.dirxml.engine.XdsUtil);
importClass(Packages.com.novell.nds.dirxml.engine.DirXML);
importClass(Packages.com.novell.nds.dirxml.engine.OperationData);
importClass(Packages.com.novell.nds.dirxml.util.DxWire);
importClass(Packages.com.novell.xml.dom.DOMQuery);
importClass(Packages.com.novell.xml.dom.DOMWriter);
importClass(Packages.novell.jclient.JCContext);
importClass(Packages.novell.jclient.JCException);
importClass(Packages.novell.jclient.JClient);
importClass(java.io.StringWriter);

var debugPrefix = 'sendQueueEvent';
var debugDefault = 3;

function serializeEx(doc, indent) {
    // 
    //requires: java.io.StringWriter
    //requires: com.novell.xml.dom.DOMWriter
    indent = "undefined" !== typeof indent ? !!indent : !0;
    var sw = new StringWriter();
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
    if (message) {
        msgString = message.toString()
        if (DirXML.isExternal()) {
            Packages.javax.swing.JOptionPane.showMessageDialog(null, debugPrefix + ': ' + msgString);
        } else {
            //default trace level of 3
            level = 'undefined' !== typeof level ? level : debugDefault;
            (new Trace(debugPrefix)).trace(msgString, level);
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
    debugMessage('Creating skeleton using context: ' + contextNode, debugDefault + 1);
    return NdsDtd.createDoc(contextNode)
}

function properXDS(doc) {
    // accepts:
    // either an XDS fragment or an entire XDS doc
    // it wraps the former in an XDS doc as necessary
    //
    // returns: 
    // XDS document: Document doc
    //
    // note:
    // will return empty XDS document when input is empty
    //
    //requires: com.novell.nds.dirxml.engine.NdsDtd;
    //requires: com.novell.nds.dirxml.engine.XdsUtil;

    // generate empty empty XDS document.
    var docRet = skeletonXDS('input');

    // will return empty XDS document when input is empty
    if (null != doc.first()) {
        var rootDocNode = (
            (null == doc.first().getOwnerDocument())
                ? doc.first()
                : doc.first().getOwnerDocument())
            .getDocumentElement()

        var rootNodeName = rootDocNode.getNodeName()
        debugMessage('Document root node: ' + rootNodeName);
        // Returning unchanged if no re-wrapping is required.
        if (null != rootDocNode && rootNodeName.equals('nds')) {
            debugMessage('Returning supplied XDS unchanged, already proper XDS', debugDefault + 1)
            return doc;
        }
        // known valid commands from XDS DTD
        if (null != rootDocNode && rootNodeName.matches('add|modify|modify-password|query|query-ex|rename|move|delete|trigger|sync')) {
            // Merging supplied XDS with wrapper
            debugMessage('Merging supplied XDS with wrapper: ' + rootNodeName, debugDefault + 1)
            Packages.com.novell.nds.dirxml.engine.XdsUtil.graftSubtree(docRet, rootDocNode);
        } else {
            debugMessage('Invalid document: ' + rootNodeName + 'is not supported.')
            return docRet
        }
    }
    return docRet.getOwnerDocument().getDocumentElement();
}

function sendQueueEvent(driverDN, myElement) {
    // this function takes either a command (modify/add/trigger) or an entire XDS doc
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
            //debugMessage('Detected theElement: ' + theElement, debugDefault + 1)
            var myEncoding = java.nio.charset.StandardCharsets.UTF_8;
            debugMessage('Validating document')

            try {
                if (null == rootDoc) {
                    var rootDoc = theElement.first().getFirstChild().getOwnerDocument()
                }
            } catch (e) { debugMessage('First node not found, falling back to first alternate mechanism') }
            try {
                if (null == rootDoc) {
                    var rootDoc = theElement.getFirstChild().getOwnerDocument()
                }
            } catch (e) { debugMessage('First node not found, falling back to second alternate mechanism' + e) }
            try {
                if (null == rootDoc) {
                    var rootDoc = theElement.first().getOwnerDocument()
                }
            } catch (e) { debugMessage('error' + e) }
            if (null == rootDoc) {
                debugMessage('Trying built-in getOwnerDocument() method as last resort');
                var rootDoc = theElement.getOwnerDocument()
            }


            try {
                if (null == myOps) {
                    var myOps = Packages.com.novell.xml.dom.DOMQuery.query(rootDoc, "//input/*");
                }
            } catch (e) {
                debugMessage(e)
            }

             if (null == myOps.first()) {
                return NdsDtd.createStatusDocument(NdsDtd.SL_WARNING, null, 'Nothing to submit!')
                    .getDocumentElement()
            }

            if (myOps.first().getLocalName().matches('add|modify|modify-password|rename|move|delete|trigger|sync|statement')) {
                debugMessage('Detected known command: ' + myOps.first().getLocalName())
            }

            else {
                debugMessage('Detected unknown command: ' + myOps.first().getLocalName() + '. Submitting anyway, it may be ignored by the shim ')
            }

            debugMessage('Serializing document to ByteArray with encoding: ' + myEncoding)
            var serializedDoc = serializeEx(rootDoc, false)
            bytes = serializedDoc.getBytes(myEncoding);

            if (null == bytes) {
                return NdsDtd.createStatusDocument(NdsDtd.SL_ERROR, null, 'XDS could not be converted to ByteArray!')
                    .getDocumentElement()
            } else {

                treeName = MiscDS.getTreeName();
                debugMessage('Detected tree name: ' + treeName);
                var context = new JCContext(0, treeName, "00.\\+=*'");
                JCHelper.loginAsServer(context);
                debugMessage('Attempting to authenticate to tree');
                context.authenticate();
                var currentDriverDN = ThreadGroupVars.get("vrDriverDN");
                debugMessage('Resolving source driver:' + currentDriverDN);
                if (null == currentDriverDN) {
                    throw new JCException("getEffectivePriviledges()", -672);
                }
                if (!(driverDN.startsWith("\\"))) {
                    debugMessage('Converting ' + driverDN + ' to absolute path...', debugDefault + 1);
                    driverDN = '\\' + treeName + '\\' + driverDN;
                }

                debugMessage('Verifying target driver exists: ' + driverDN);
                context.nameToID(1, driverDN);
                debugMessage('Verifying rights to source driver: ' + currentDriverDN);
                if ((context.getEffectivePrivileges(currentDriverDN, "[Entry Rights]") & 0x10) == (new java.lang.Long(0))) {
                    throw new JCException("getEffectivePriviledges()", -672);
                }

                debugMessage('Queuing supplied XDS');
                var wireCtor = new DxWire();
                wireCtor.setDnFormat(0);
                result = sendWireRequest(context, wireCtor.constructQueueEvent(driverDN, bytes));
                output = NdsDtd.createStatusDocument(NdsDtd.SL_SUCCESS, null, 'Submitted document for execution on subscriber channel on driver: ' + driverDN)
                    .getDocumentElement()
            }

        } catch (t) {
            return NdsDtd.createStatusDocument(NdsDtd.SL_ERROR, null, 'Error: ' + t).getDocumentElement();
        } finally {
            if (context != null) {
                context.free();
            }
        }
    }
    return output;
}

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