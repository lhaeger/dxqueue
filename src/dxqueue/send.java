package dxqueue;

import com.novell.nds.dhutil.JCHelper;
import com.novell.nds.dirxml.driver.Trace;
import com.novell.nds.dirxml.engine.MiscDS;
import com.novell.nds.dirxml.engine.NdsDtd;
import com.novell.nds.dirxml.engine.OperationData;
import com.novell.nds.dirxml.engine.ThreadGroupVars;
import com.novell.nds.dirxml.engine.XdsUtil;
import com.novell.nds.dirxml.util.DxWire;
import com.novell.xml.dom.DOMWriter;
import java.io.ByteArrayOutputStream;
import novell.jclient.JCContext;
import novell.jclient.JCException;
import novell.jclient.JClient;
import org.w3c.dom.Element;

public abstract class send {
	
	// An updated version of https://community.microfocus.com/t5/Identity-Manager-Tips/Sending-a-XDS-Message-from-one-driver-to-another/ta-p/1777175

	public static final String VERSION = "1.2.0";

	public static Element sendQueueEvent(String driverDN, Element element) {

		ByteArrayOutputStream baos;
		JCContext context = null;
		OperationData opdata = new OperationData(null);
		Trace tracer = new Trace("dxqueue");

		try {

			String treeName = MiscDS.getTreeName();
			context = new JCContext(0, treeName, "00.\\+=*'");

			tracer.trace("Authenticating...", 4);
			JCHelper.loginAsServer(context);
			context.authenticate();

			String currentDriverDN = (String) ThreadGroupVars.get("vrDriverDN");
			tracer.trace("Verifying access to " + currentDriverDN + "...", 4);
			if (currentDriverDN == null) {
				throw new JCException("getEffectivePriviledges()", -672);
			}

			if (!(driverDN.startsWith("\\"))) {
				tracer.trace("Converting " + driverDN + " to absolute path...", 4);
				driverDN = "\\" + treeName + "\\" + driverDN;
			}

			tracer.trace("Verifying access to " + driverDN + "...", 4);
			context.nameToID(1, driverDN);
			if ((context.getEffectivePrivileges(currentDriverDN, "[Entry Rights]") & 0x10) == 0L) {
				throw new JCException("getEffectivePriviledges()", -672);
			}

			String rootNodeName = element.getNodeName();
			if (!(rootNodeName.equals("nds"))) {
				if (rootNodeName.matches("add|modify|rename|move|delete|trigger|sync")) {
					tracer.trace("Wrapping XDS document around " + rootNodeName + " node...", 4);
					Element rootElement = NdsDtd.createDoc("input");
					XdsUtil.graftSubtree(rootElement, element);
					element = rootElement.getOwnerDocument().getDocumentElement();
				} else {
					return NdsDtd.createStatusDocument(NdsDtd.SL_ERROR, opdata, "Invalid document: " + rootNodeName + " is not supported.").getDocumentElement();
				}
			}

			tracer.trace("Converting document to byte array...", 4);
			baos = new ByteArrayOutputStream();
			DOMWriter domWriter = new DOMWriter(element, baos, "UTF-8");
			domWriter.setEncoding("UTF-8");
			domWriter.write();
			byte[] bytes = baos.toByteArray();

			tracer.trace("Submitting document...", 4);
			DxWire wireCtor = getDxWire();
			@SuppressWarnings("unused")
			byte[] result = sendWireRequest(context, wireCtor.constructQueueEvent(driverDN, bytes));

			return NdsDtd.createStatusDocument(NdsDtd.SL_SUCCESS, opdata, "Submitted document to " + driverDN).getDocumentElement();

		} catch (Throwable t) {

			return NdsDtd.createStatusDocument(t, opdata).getDocumentElement();

		} finally {

			if (context != null) {
				context.free();
			}
		}
	}

	public static Element sendMigrateApp(String driverDN, Element element) {

		ByteArrayOutputStream baos;
		JCContext context = null;
		OperationData opdata = new OperationData(null);
		Trace tracer = new Trace("dxqueue");

		try {

			String treeName = MiscDS.getTreeName();
			context = new JCContext(0, treeName, "00.\\+=*'");

			tracer.trace("Authenticating...", 4);
			JCHelper.loginAsServer(context);
			context.authenticate();

			String currentDriverDN = (String) ThreadGroupVars.get("vrDriverDN");
			tracer.trace("Verifying access to " + currentDriverDN + "...", 4);
			if (currentDriverDN == null) {
				throw new JCException("getEffectivePriviledges()", -672);
			}

			if (!(driverDN.startsWith("\\"))) {
				tracer.trace("Converting " + driverDN + " to absolute path...", 4);
				driverDN = "\\" + treeName + "\\" + driverDN;
			}

			tracer.trace("Verifying access to " + driverDN + "...", 4);
			context.nameToID(1, driverDN);
			if ((context.getEffectivePrivileges(currentDriverDN, "[Entry Rights]") & 0x10) == 0L) {
				throw new JCException("getEffectivePriviledges()", -672);
			}

			String rootNodeName = element.getNodeName();
			if (!(rootNodeName.equals("nds"))) {
				if (rootNodeName.matches("query|query-ex")) {
					tracer.trace("Wrapping XDS document around " + rootNodeName + " node...", 4);
					Element rootElement = NdsDtd.createDoc("input");
					XdsUtil.graftSubtree(rootElement, element);
					element = rootElement.getOwnerDocument().getDocumentElement();
				} else {
					return NdsDtd.createStatusDocument(NdsDtd.SL_ERROR, opdata, "Invalid document: " + rootNodeName + " is not supported.").getDocumentElement();
				}
			}

			tracer.trace("Converting document to byte array...", 4);
			baos = new ByteArrayOutputStream();
			DOMWriter domWriter = new DOMWriter(element, baos, "UTF-8");
			domWriter.setEncoding("UTF-8");
			domWriter.write();
			byte[] bytes = baos.toByteArray();

			tracer.trace("Submitting document...", 4);
			DxWire wireCtor = getDxWire();
			@SuppressWarnings("unused")
			byte[] result = sendWireRequest(context, wireCtor.constructMigrateApp(driverDN, bytes));

			return NdsDtd.createStatusDocument(NdsDtd.SL_SUCCESS, opdata, "Submitted document to " + driverDN).getDocumentElement();

		} catch (Throwable t) {

			return NdsDtd.createStatusDocument(t, opdata).getDocumentElement();

		} finally {

			if (context != null) {
				context.free();
			}
		}
	}


	private static DxWire getDxWire() {

		DxWire wireCtor = new DxWire();
		wireCtor.setDnFormat(0);
		return wireCtor;
	}

	private static byte[] sendWireRequest(JCContext context, DxWire.DxWireData wireData) throws JCException {

		byte[] replyBuffer = new byte[wireData.getResponseSize()];
		int replySize = JClient.ndsRequest(context, wireData.getVerb(), wireData.getRequestData().length, wireData.getRequestData(),
				replyBuffer.length, replyBuffer);

		if (replySize == 0) {
			return null;
		} else if (replySize != replyBuffer.length) {
			byte[] temp = new byte[replySize];
			System.arraycopy(replyBuffer, 0, temp, 0, replySize);
			replyBuffer = temp;
		}
		return replyBuffer;
	}
}