package system;

import com.mendix.core.actionmanagement.IActionRegistrator;

public class UserActionsRegistrar
{
  public void registerActions(IActionRegistrator registrator)
  {
    registrator.bundleComponentLoaded();
    registrator.registerUserAction(nivotestdata.actions.GetFileContentsFromResources.class);
    registrator.registerUserAction(nivotestdata.actions.GetPath.class);
    registrator.registerUserAction(system.actions.VerifyPassword.class);
  }
}
