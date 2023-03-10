// This file was generated by Mendix Studio Pro.
//
// WARNING: Code you write here will be lost the next time you deploy the project.

package nivotestdata.proxies.microflows;

import java.util.HashMap;
import java.util.Map;
import com.mendix.core.Core;
import com.mendix.systemwideinterfaces.core.IContext;

public class Microflows
{
	/**
	 * @deprecated
	 * The default constructor of the Microflows class should not be used.
	 * Use the static microflow invocation methods instead.
	 */
	@java.lang.Deprecated(since = "9.12", forRemoval = true)
	public Microflows() {}

	// These are the microflows for the NivoTestData module
	public static java.lang.String sUB_GetFileContentsFromResources(IContext context, java.lang.String _filename)
	{
		Map<java.lang.String, Object> params = new HashMap<>();
		params.put("Filename", _filename);
		return (java.lang.String) Core.microflowCall("NivoTestData.SUB_GetFileContentsFromResources").withParams(params).execute(context);
	}
}
