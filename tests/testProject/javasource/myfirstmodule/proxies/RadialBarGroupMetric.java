// This file was generated by Mendix Studio Pro.
//
// WARNING: Code you write here will be lost the next time you deploy the project.

package myfirstmodule.proxies;

public class RadialBarGroupMetric
{
	private final com.mendix.systemwideinterfaces.core.IMendixObject radialBarGroupMetricMendixObject;

	private final com.mendix.systemwideinterfaces.core.IContext context;

	/**
	 * Internal name of this entity
	 */
	public static final java.lang.String entityName = "MyFirstModule.RadialBarGroupMetric";

	/**
	 * Enum describing members of this entity
	 */
	public enum MemberNames
	{
		x("x"),
		y("y"),
		RadialBarGroupMetric_RadialBarGroup_2("MyFirstModule.RadialBarGroupMetric_RadialBarGroup_2"),
		RadialBarGroupMetric_RadialBarContainer("MyFirstModule.RadialBarGroupMetric_RadialBarContainer");

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

	public RadialBarGroupMetric(com.mendix.systemwideinterfaces.core.IContext context)
	{
		this(context, com.mendix.core.Core.instantiate(context, entityName));
	}

	protected RadialBarGroupMetric(com.mendix.systemwideinterfaces.core.IContext context, com.mendix.systemwideinterfaces.core.IMendixObject radialBarGroupMetricMendixObject)
	{
		if (radialBarGroupMetricMendixObject == null) {
			throw new java.lang.IllegalArgumentException("The given object cannot be null.");
		}
		if (!com.mendix.core.Core.isSubClassOf(entityName, radialBarGroupMetricMendixObject.getType())) {
			throw new java.lang.IllegalArgumentException(String.format("The given object is not a %s", entityName));
		}	

		this.radialBarGroupMetricMendixObject = radialBarGroupMetricMendixObject;
		this.context = context;
	}

	/**
	 * @deprecated Use 'RadialBarGroupMetric.load(IContext, IMendixIdentifier)' instead.
	 */
	@java.lang.Deprecated
	public static myfirstmodule.proxies.RadialBarGroupMetric initialize(com.mendix.systemwideinterfaces.core.IContext context, com.mendix.systemwideinterfaces.core.IMendixIdentifier mendixIdentifier) throws com.mendix.core.CoreException
	{
		return myfirstmodule.proxies.RadialBarGroupMetric.load(context, mendixIdentifier);
	}

	/**
	 * Initialize a proxy using context (recommended). This context will be used for security checking when the get- and set-methods without context parameters are called.
	 * The get- and set-methods with context parameter should be used when for instance sudo access is necessary (IContext.createSudoClone() can be used to obtain sudo access).
	 * @param context The context to be used
	 * @param mendixObject The Mendix object for the new instance
	 * @return a new instance of this proxy class
	 */
	public static myfirstmodule.proxies.RadialBarGroupMetric initialize(com.mendix.systemwideinterfaces.core.IContext context, com.mendix.systemwideinterfaces.core.IMendixObject mendixObject)
	{
		return new myfirstmodule.proxies.RadialBarGroupMetric(context, mendixObject);
	}

	public static myfirstmodule.proxies.RadialBarGroupMetric load(com.mendix.systemwideinterfaces.core.IContext context, com.mendix.systemwideinterfaces.core.IMendixIdentifier mendixIdentifier) throws com.mendix.core.CoreException
	{
		com.mendix.systemwideinterfaces.core.IMendixObject mendixObject = com.mendix.core.Core.retrieveId(context, mendixIdentifier);
		return myfirstmodule.proxies.RadialBarGroupMetric.initialize(context, mendixObject);
	}

	public static java.util.List<myfirstmodule.proxies.RadialBarGroupMetric> load(com.mendix.systemwideinterfaces.core.IContext context, java.lang.String xpathConstraint) throws com.mendix.core.CoreException
	{
		return com.mendix.core.Core.createXPathQuery(String.format("//%1$s%2$s", entityName, xpathConstraint))
			.execute(context)
			.stream()
			.map(obj -> myfirstmodule.proxies.RadialBarGroupMetric.initialize(context, obj))
			.collect(java.util.stream.Collectors.toList());
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
	 * @return value of x
	 */
	public final java.lang.String getx()
	{
		return getx(getContext());
	}

	/**
	 * @param context
	 * @return value of x
	 */
	public final java.lang.String getx(com.mendix.systemwideinterfaces.core.IContext context)
	{
		return (java.lang.String) getMendixObject().getValue(context, MemberNames.x.toString());
	}

	/**
	 * Set value of x
	 * @param x
	 */
	public final void setx(java.lang.String x)
	{
		setx(getContext(), x);
	}

	/**
	 * Set value of x
	 * @param context
	 * @param x
	 */
	public final void setx(com.mendix.systemwideinterfaces.core.IContext context, java.lang.String x)
	{
		getMendixObject().setValue(context, MemberNames.x.toString(), x);
	}

	/**
	 * @return value of y
	 */
	public final java.math.BigDecimal gety()
	{
		return gety(getContext());
	}

	/**
	 * @param context
	 * @return value of y
	 */
	public final java.math.BigDecimal gety(com.mendix.systemwideinterfaces.core.IContext context)
	{
		return (java.math.BigDecimal) getMendixObject().getValue(context, MemberNames.y.toString());
	}

	/**
	 * Set value of y
	 * @param y
	 */
	public final void sety(java.math.BigDecimal y)
	{
		sety(getContext(), y);
	}

	/**
	 * Set value of y
	 * @param context
	 * @param y
	 */
	public final void sety(com.mendix.systemwideinterfaces.core.IContext context, java.math.BigDecimal y)
	{
		getMendixObject().setValue(context, MemberNames.y.toString(), y);
	}

	/**
	 * @throws com.mendix.core.CoreException
	 * @return value of RadialBarGroupMetric_RadialBarGroup_2
	 */
	public final myfirstmodule.proxies.RadialBarGroup getRadialBarGroupMetric_RadialBarGroup_2() throws com.mendix.core.CoreException
	{
		return getRadialBarGroupMetric_RadialBarGroup_2(getContext());
	}

	/**
	 * @param context
	 * @return value of RadialBarGroupMetric_RadialBarGroup_2
	 * @throws com.mendix.core.CoreException
	 */
	public final myfirstmodule.proxies.RadialBarGroup getRadialBarGroupMetric_RadialBarGroup_2(com.mendix.systemwideinterfaces.core.IContext context) throws com.mendix.core.CoreException
	{
		myfirstmodule.proxies.RadialBarGroup result = null;
		com.mendix.systemwideinterfaces.core.IMendixIdentifier identifier = getMendixObject().getValue(context, MemberNames.RadialBarGroupMetric_RadialBarGroup_2.toString());
		if (identifier != null) {
			result = myfirstmodule.proxies.RadialBarGroup.load(context, identifier);
		}
		return result;
	}

	/**
	 * Set value of RadialBarGroupMetric_RadialBarGroup_2
	 * @param radialbargroupmetric_radialbargroup_2
	 */
	public final void setRadialBarGroupMetric_RadialBarGroup_2(myfirstmodule.proxies.RadialBarGroup radialbargroupmetric_radialbargroup_2)
	{
		setRadialBarGroupMetric_RadialBarGroup_2(getContext(), radialbargroupmetric_radialbargroup_2);
	}

	/**
	 * Set value of RadialBarGroupMetric_RadialBarGroup_2
	 * @param context
	 * @param radialbargroupmetric_radialbargroup_2
	 */
	public final void setRadialBarGroupMetric_RadialBarGroup_2(com.mendix.systemwideinterfaces.core.IContext context, myfirstmodule.proxies.RadialBarGroup radialbargroupmetric_radialbargroup_2)
	{
		if (radialbargroupmetric_radialbargroup_2 == null) {
			getMendixObject().setValue(context, MemberNames.RadialBarGroupMetric_RadialBarGroup_2.toString(), null);
		} else {
			getMendixObject().setValue(context, MemberNames.RadialBarGroupMetric_RadialBarGroup_2.toString(), radialbargroupmetric_radialbargroup_2.getMendixObject().getId());
		}
	}

	/**
	 * @throws com.mendix.core.CoreException
	 * @return value of RadialBarGroupMetric_RadialBarContainer
	 */
	public final myfirstmodule.proxies.RadialBarContainer getRadialBarGroupMetric_RadialBarContainer() throws com.mendix.core.CoreException
	{
		return getRadialBarGroupMetric_RadialBarContainer(getContext());
	}

	/**
	 * @param context
	 * @return value of RadialBarGroupMetric_RadialBarContainer
	 * @throws com.mendix.core.CoreException
	 */
	public final myfirstmodule.proxies.RadialBarContainer getRadialBarGroupMetric_RadialBarContainer(com.mendix.systemwideinterfaces.core.IContext context) throws com.mendix.core.CoreException
	{
		myfirstmodule.proxies.RadialBarContainer result = null;
		com.mendix.systemwideinterfaces.core.IMendixIdentifier identifier = getMendixObject().getValue(context, MemberNames.RadialBarGroupMetric_RadialBarContainer.toString());
		if (identifier != null) {
			result = myfirstmodule.proxies.RadialBarContainer.load(context, identifier);
		}
		return result;
	}

	/**
	 * Set value of RadialBarGroupMetric_RadialBarContainer
	 * @param radialbargroupmetric_radialbarcontainer
	 */
	public final void setRadialBarGroupMetric_RadialBarContainer(myfirstmodule.proxies.RadialBarContainer radialbargroupmetric_radialbarcontainer)
	{
		setRadialBarGroupMetric_RadialBarContainer(getContext(), radialbargroupmetric_radialbarcontainer);
	}

	/**
	 * Set value of RadialBarGroupMetric_RadialBarContainer
	 * @param context
	 * @param radialbargroupmetric_radialbarcontainer
	 */
	public final void setRadialBarGroupMetric_RadialBarContainer(com.mendix.systemwideinterfaces.core.IContext context, myfirstmodule.proxies.RadialBarContainer radialbargroupmetric_radialbarcontainer)
	{
		if (radialbargroupmetric_radialbarcontainer == null) {
			getMendixObject().setValue(context, MemberNames.RadialBarGroupMetric_RadialBarContainer.toString(), null);
		} else {
			getMendixObject().setValue(context, MemberNames.RadialBarGroupMetric_RadialBarContainer.toString(), radialbargroupmetric_radialbarcontainer.getMendixObject().getId());
		}
	}

	/**
	 * @return the IMendixObject instance of this proxy for use in the Core interface.
	 */
	public final com.mendix.systemwideinterfaces.core.IMendixObject getMendixObject()
	{
		return radialBarGroupMetricMendixObject;
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
			final myfirstmodule.proxies.RadialBarGroupMetric that = (myfirstmodule.proxies.RadialBarGroupMetric) obj;
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