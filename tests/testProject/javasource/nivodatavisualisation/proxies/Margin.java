// This file was generated by Mendix Studio Pro.
//
// WARNING: Code you write here will be lost the next time you deploy the project.

package nivodatavisualisation.proxies;

public class Margin
{
	private final com.mendix.systemwideinterfaces.core.IMendixObject marginMendixObject;

	private final com.mendix.systemwideinterfaces.core.IContext context;

	/**
	 * Internal name of this entity
	 */
	public static final java.lang.String entityName = "NivoDataVisualisation.Margin";

	/**
	 * Enum describing members of this entity
	 */
	public enum MemberNames
	{
		Top("Top"),
		Right("Right"),
		Bottom("Bottom"),
		Left("Left"),
		ChartConfiguration_Margin("NivoDataVisualisation.ChartConfiguration_Margin");

		private final java.lang.String metaName;

		MemberNames(java.lang.String s)
		{
			metaName = s;
		}

		@java.lang.Override
		public java.lang.String toString()
		{
			return metaName;
		}
	}

	public Margin(com.mendix.systemwideinterfaces.core.IContext context)
	{
		this(context, com.mendix.core.Core.instantiate(context, entityName));
	}

	protected Margin(com.mendix.systemwideinterfaces.core.IContext context, com.mendix.systemwideinterfaces.core.IMendixObject marginMendixObject)
	{
		if (marginMendixObject == null) {
			throw new java.lang.IllegalArgumentException("The given object cannot be null.");
		}
		if (!com.mendix.core.Core.isSubClassOf(entityName, marginMendixObject.getType())) {
			throw new java.lang.IllegalArgumentException(String.format("The given object is not a %s", entityName));
		}	

		this.marginMendixObject = marginMendixObject;
		this.context = context;
	}

	/**
	 * @deprecated Use 'Margin.load(IContext, IMendixIdentifier)' instead.
	 */
	@java.lang.Deprecated
	public static nivodatavisualisation.proxies.Margin initialize(com.mendix.systemwideinterfaces.core.IContext context, com.mendix.systemwideinterfaces.core.IMendixIdentifier mendixIdentifier) throws com.mendix.core.CoreException
	{
		return nivodatavisualisation.proxies.Margin.load(context, mendixIdentifier);
	}

	/**
	 * Initialize a proxy using context (recommended). This context will be used for security checking when the get- and set-methods without context parameters are called.
	 * The get- and set-methods with context parameter should be used when for instance sudo access is necessary (IContext.createSudoClone() can be used to obtain sudo access).
	 * @param context The context to be used
	 * @param mendixObject The Mendix object for the new instance
	 * @return a new instance of this proxy class
	 */
	public static nivodatavisualisation.proxies.Margin initialize(com.mendix.systemwideinterfaces.core.IContext context, com.mendix.systemwideinterfaces.core.IMendixObject mendixObject)
	{
		return new nivodatavisualisation.proxies.Margin(context, mendixObject);
	}

	public static nivodatavisualisation.proxies.Margin load(com.mendix.systemwideinterfaces.core.IContext context, com.mendix.systemwideinterfaces.core.IMendixIdentifier mendixIdentifier) throws com.mendix.core.CoreException
	{
		com.mendix.systemwideinterfaces.core.IMendixObject mendixObject = com.mendix.core.Core.retrieveId(context, mendixIdentifier);
		return nivodatavisualisation.proxies.Margin.initialize(context, mendixObject);
	}

	/**
	 * Commit the changes made on this proxy object.
	 * @throws com.mendix.core.CoreException
	 */
	public final void commit() throws com.mendix.core.CoreException
	{
		com.mendix.core.Core.commit(context, getMendixObject());
	}

	/**
	 * Commit the changes made on this proxy object using the specified context.
	 * @throws com.mendix.core.CoreException
	 */
	public final void commit(com.mendix.systemwideinterfaces.core.IContext context) throws com.mendix.core.CoreException
	{
		com.mendix.core.Core.commit(context, getMendixObject());
	}

	/**
	 * Delete the object.
	 */
	public final void delete()
	{
		com.mendix.core.Core.delete(context, getMendixObject());
	}

	/**
	 * Delete the object using the specified context.
	 */
	public final void delete(com.mendix.systemwideinterfaces.core.IContext context)
	{
		com.mendix.core.Core.delete(context, getMendixObject());
	}
	/**
	 * @return value of Top
	 */
	public final java.lang.Integer getTop()
	{
		return getTop(getContext());
	}

	/**
	 * @param context
	 * @return value of Top
	 */
	public final java.lang.Integer getTop(com.mendix.systemwideinterfaces.core.IContext context)
	{
		return (java.lang.Integer) getMendixObject().getValue(context, MemberNames.Top.toString());
	}

	/**
	 * Set value of Top
	 * @param top
	 */
	public final void setTop(java.lang.Integer top)
	{
		setTop(getContext(), top);
	}

	/**
	 * Set value of Top
	 * @param context
	 * @param top
	 */
	public final void setTop(com.mendix.systemwideinterfaces.core.IContext context, java.lang.Integer top)
	{
		getMendixObject().setValue(context, MemberNames.Top.toString(), top);
	}

	/**
	 * @return value of Right
	 */
	public final java.lang.Integer getRight()
	{
		return getRight(getContext());
	}

	/**
	 * @param context
	 * @return value of Right
	 */
	public final java.lang.Integer getRight(com.mendix.systemwideinterfaces.core.IContext context)
	{
		return (java.lang.Integer) getMendixObject().getValue(context, MemberNames.Right.toString());
	}

	/**
	 * Set value of Right
	 * @param right
	 */
	public final void setRight(java.lang.Integer right)
	{
		setRight(getContext(), right);
	}

	/**
	 * Set value of Right
	 * @param context
	 * @param right
	 */
	public final void setRight(com.mendix.systemwideinterfaces.core.IContext context, java.lang.Integer right)
	{
		getMendixObject().setValue(context, MemberNames.Right.toString(), right);
	}

	/**
	 * @return value of Bottom
	 */
	public final java.lang.Integer getBottom()
	{
		return getBottom(getContext());
	}

	/**
	 * @param context
	 * @return value of Bottom
	 */
	public final java.lang.Integer getBottom(com.mendix.systemwideinterfaces.core.IContext context)
	{
		return (java.lang.Integer) getMendixObject().getValue(context, MemberNames.Bottom.toString());
	}

	/**
	 * Set value of Bottom
	 * @param bottom
	 */
	public final void setBottom(java.lang.Integer bottom)
	{
		setBottom(getContext(), bottom);
	}

	/**
	 * Set value of Bottom
	 * @param context
	 * @param bottom
	 */
	public final void setBottom(com.mendix.systemwideinterfaces.core.IContext context, java.lang.Integer bottom)
	{
		getMendixObject().setValue(context, MemberNames.Bottom.toString(), bottom);
	}

	/**
	 * @return value of Left
	 */
	public final java.lang.Integer getLeft()
	{
		return getLeft(getContext());
	}

	/**
	 * @param context
	 * @return value of Left
	 */
	public final java.lang.Integer getLeft(com.mendix.systemwideinterfaces.core.IContext context)
	{
		return (java.lang.Integer) getMendixObject().getValue(context, MemberNames.Left.toString());
	}

	/**
	 * Set value of Left
	 * @param left
	 */
	public final void setLeft(java.lang.Integer left)
	{
		setLeft(getContext(), left);
	}

	/**
	 * Set value of Left
	 * @param context
	 * @param left
	 */
	public final void setLeft(com.mendix.systemwideinterfaces.core.IContext context, java.lang.Integer left)
	{
		getMendixObject().setValue(context, MemberNames.Left.toString(), left);
	}

	/**
	 * @throws com.mendix.core.CoreException
	 * @return value of ChartConfiguration_Margin
	 */
	public final nivodatavisualisation.proxies.ChartConfiguration getChartConfiguration_Margin() throws com.mendix.core.CoreException
	{
		return getChartConfiguration_Margin(getContext());
	}

	/**
	 * @param context
	 * @return value of ChartConfiguration_Margin
	 * @throws com.mendix.core.CoreException
	 */
	public final nivodatavisualisation.proxies.ChartConfiguration getChartConfiguration_Margin(com.mendix.systemwideinterfaces.core.IContext context) throws com.mendix.core.CoreException
	{
		nivodatavisualisation.proxies.ChartConfiguration result = null;
		com.mendix.systemwideinterfaces.core.IMendixIdentifier identifier = getMendixObject().getValue(context, MemberNames.ChartConfiguration_Margin.toString());
		if (identifier != null) {
			result = nivodatavisualisation.proxies.ChartConfiguration.load(context, identifier);
		}
		return result;
	}

	/**
	 * Set value of ChartConfiguration_Margin
	 * @param chartconfiguration_margin
	 */
	public final void setChartConfiguration_Margin(nivodatavisualisation.proxies.ChartConfiguration chartconfiguration_margin)
	{
		setChartConfiguration_Margin(getContext(), chartconfiguration_margin);
	}

	/**
	 * Set value of ChartConfiguration_Margin
	 * @param context
	 * @param chartconfiguration_margin
	 */
	public final void setChartConfiguration_Margin(com.mendix.systemwideinterfaces.core.IContext context, nivodatavisualisation.proxies.ChartConfiguration chartconfiguration_margin)
	{
		if (chartconfiguration_margin == null) {
			getMendixObject().setValue(context, MemberNames.ChartConfiguration_Margin.toString(), null);
		} else {
			getMendixObject().setValue(context, MemberNames.ChartConfiguration_Margin.toString(), chartconfiguration_margin.getMendixObject().getId());
		}
	}

	/**
	 * @return the IMendixObject instance of this proxy for use in the Core interface.
	 */
	public final com.mendix.systemwideinterfaces.core.IMendixObject getMendixObject()
	{
		return marginMendixObject;
	}

	/**
	 * @return the IContext instance of this proxy, or null if no IContext instance was specified at initialization.
	 */
	public final com.mendix.systemwideinterfaces.core.IContext getContext()
	{
		return context;
	}

	@java.lang.Override
	public boolean equals(Object obj)
	{
		if (obj == this) {
			return true;
		}
		if (obj != null && getClass().equals(obj.getClass()))
		{
			final nivodatavisualisation.proxies.Margin that = (nivodatavisualisation.proxies.Margin) obj;
			return getMendixObject().equals(that.getMendixObject());
		}
		return false;
	}

	@java.lang.Override
	public int hashCode()
	{
		return getMendixObject().hashCode();
	}

	/**
	 * @return String name of this class
	 */
	public static java.lang.String getType()
	{
		return entityName;
	}

	/**
	 * @return String GUID from this object, format: ID_0000000000
	 * @deprecated Use getMendixObject().getId().toLong() to get a unique identifier for this object.
	 */
	@java.lang.Deprecated
	public java.lang.String getGUID()
	{
		return "ID_" + getMendixObject().getId().toLong();
	}
}