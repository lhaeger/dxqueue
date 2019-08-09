package dxqueue;

import com.novell.nds.dhutil.JCHelper;
import com.novell.nds.dirxml.driver.XmlDocument;
import com.novell.nds.dirxml.engine.MiscDS;
import com.novell.nds.dirxml.engine.NdsDtd;
import com.novell.nds.dirxml.engine.ThreadGroupVars;
import com.novell.nds.dirxml.engine.XdsUtil;
import com.novell.nds.dirxml.util.DxWire;
import com.novell.xml.dom.DOMWriter;
import java.io.ByteArrayOutputStream;
import novell.jclient.JCContext;
import novell.jclient.JCException;
import novell.jclient.JClient;
//import org.w3c.dom.Document;
import org.w3c.dom.Element;

public abstract class send
{

  public static Element sendQueueEvent(String driverDN, Element element)
  {
    ByteArrayOutputStream baos;
    JCContext context = null;
    try
    {
      context = new JCContext(0, MiscDS.getTreeName(), "00.\\+=*'");

      JCHelper.loginAsServer(context);
      context.authenticate();

      String currentDriverDN = (String)ThreadGroupVars.get("vrDriverDN");
      if (currentDriverDN == null)
      {
        throw new JCException("getEffectivePriviledges()", -672);
      }
      context.nameToID(1, driverDN);
      if ((context.getEffectivePrivileges(currentDriverDN, "[Entry Rights]") & 0x10) == 0L)
      {
        throw new JCException("getEffectivePriviledges()", -672);
      }

      if (!(element.getNodeName().equals("nds")))
      {
        Element rootElement = NdsDtd.createDoc("input");
        XdsUtil.graftSubtree(rootElement, element);
        element = rootElement.getOwnerDocument().getDocumentElement();
      }

      baos = new ByteArrayOutputStream();
      DOMWriter domWriter = new DOMWriter(element, baos, "UTF-8");
      domWriter.setEncoding("UTF-8");
      domWriter.write();
      byte[] bytes = baos.toByteArray();
      DxWire wireCtor = getDxWire();
      byte[] result = sendWireRequest(context, wireCtor.constructQueueEvent(driverDN, bytes));
      Element output = new XmlDocument("<success/>").getDocument().getDocumentElement();
      return output;
    }
    catch (Throwable t)
    {
      return NdsDtd.createStatusDocument(t, null).getDocumentElement();
    }
    finally
    {
      if (context != null)
      {
        context.free();
      }
    }
  }

  private static DxWire getDxWire()
  {
    DxWire wireCtor = new DxWire();
    wireCtor.setDnFormat(0);
    return wireCtor;
  }

  private static byte[] sendWireRequest(JCContext context, DxWire.DxWireData wireData)
    throws JCException
  {
    byte[] replyBuffer = new byte[wireData.getResponseSize()];
    int replySize = JClient.ndsRequest(context, wireData.getVerb(), wireData.getRequestData().length, wireData.getRequestData(), replyBuffer.length, replyBuffer);

    if (replySize == 0)
    {
      return null;
    }
    if (replySize != replyBuffer.length)
    {
      byte[] temp = new byte[replySize];
      System.arraycopy(replyBuffer, 0, temp, 0, replySize);
      replyBuffer = temp;
    }
    return replyBuffer;
  }
}