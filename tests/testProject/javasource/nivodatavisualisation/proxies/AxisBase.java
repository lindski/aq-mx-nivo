// This file was generated by Mendix Studio Pro.
//
// WARNING: Code you write here will be lost the next time you deploy the project.

package nivodatavisualisation.proxies;

public class AxisBase
{
	private final com.mendix.systemwideinterfaces.core.IMendixObject axisBaseMendixObject;

	private final com.mendix.systemwideinterfaces.core.IContext context;

	/**
	 * Internal name of this entity
	 */
	public static final java.lang.String entityName = "NivoDataVisualisation.AxisBase";

	/**
	 * Enum describing members of this entity
	 */
	public enum MemberNames
	{
		TickSize("TickSize"),
		TickPadding("TickPadding"),
		TickRotation("TickRotation");

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

	public AxisBase(com.mendix.systemwideinterfaces.core.IContext context)
	{
		this(context, com.mendix.core.Core.instantiate(context, entityName));
	}

	protected AxisBase(com.mendix.systemwideinterfaces.core.IContext context, com.mendix.systemwideinterfaces.core.IMendixObject axisBaseMendixObject)
	{
		if (axisBaseMendixObject == null) {
			throw new java.lang.IllegalArgumentException("The given object cannot be null.");
		}
		if (!com.mendix.core.Core.isSubClassOf(entityName, axisBaseMendixObject.getType())) {
			throw new java.lang.IllegalArgumentException(String.format("The given object is not a %s", entityName));
		}	

		this.axisBaseMendixObject = axisBaseMendixObject;
		this.context = context;
	}

	/**
	 * @deprecated Use 'AxisBase.load(IContext, IMendixIdentifier)' instead.
	 */
	@java.lang.Deprecated
	public static nivodatavisualisation.proxies.AxisBase initialize(com.mendix.systemwideinterfaces.core.IContext context, com.mendix.systemwideinterfaces.core.IMendixIdentifier mendixIdentifier) throws com.mendix.core.CoreException
	{
		return nivodatavisualisation.proxies.AxisBase.load(context, mendixIdentifier);
	}

	/**
	 * Initialize a proxy using context (recommended). This context will be used for security checking when the get- and set-methods without context parameters are called.
	 * The get- and set-methods with context parameter should be used when for instance sudo access is necessary (IContext.createSudoClone() can be used to obtain sudo access).
	 * @param context The context to be used
	 * @param mendixObject The Mendix object for the new instance
	 * @return a new instance of this proxy class
	 */
	public static nivodatavisualisation.proxies.AxisBase initialize(com.mendix.systemwideinterfaces.core.IContext context, com.mendix.systemwideinterfaces.core.IMendixObject mendixObject)
	{
		if (com.mendix.core.Core.isSubClassOf("NivoDataVisualisation.CircularAxisOuter", mendixObject.getType())) {
			return nivodatavisualisation.proxies.CircularAxisOuter.initialize(context, mendixObject);
		}
		if (com.mendix.core.Core.isSubClassOf("NivoDataVisualisation.RadialAxisStart", mendixObject.getType())) {
			return nivodatavisualisation.proxies.RadialAxisStart.initialize(context, mendixObject);
		}
		return new nivodatavisualisation.proxies.AxisBase(context, mendixObject);
	}

	public static nivodatavisualisation.proxies.AxisBase load(com.mendix.systemwideinterfaces.core.IContext context, com.mendix.systemwideinterfaces.core.IMendixIdentifier mendixIdentifier) throws com.mendix.core.CoreException
	{
		com.mendix.systemwideinterfaces.core.IMendixObject mendixObject = com.mendix.core.Core.retrieveId(context, mendixIdentifier);
		return nivodatavisualisation.proxies.AxisBase.initialize(context, mendixObject);
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
	 * @return value of TickSize
	 */
	public final java.lang.Integer getTickSize()
	{
		return getTickSize(getContext());
	}

	/**
	 * @param context
	 * @return value of TickSize
	 */
	public final java.lang.Integer getTickSize(com.mendix.systemwideinterfaces.core.IContext context)
	{
		return (java.lang.Integer) getMendixObject().getValue(context, MemberNames.TickSize.toString());
	}

	/**
	 * Set value of TickSize
	 * @param ticksize
	 */
	public final void setTickSize(java.lang.Integer ticksize)
	{
		setTickSize(getContext(), ticksize);
	}

	/**
	 * Set value of TickSize
	 * @param context
	 * @param ticksize
	 */
	public final void setTickSize(com.mendix.systemwideinterfaces.core.IContext context, java.lang.Integer ticksize)
	{
		getMendixObject().setValue(context, MemberNames.TickSize.toString(), ticksize);
	}

	/**
	 * @return value of TickPadding
	 */
	public final java.lang.Integer getTickPadding()
	{
		return getTickPadding(getContext());
	}

	/**
	 * @param context
	 * @return value of TickPadding
	 */
	public final java.lang.Integer getTickPadding(com.mendix.systemwideinterfaces.core.IContext context)
	{
		return (java.lang.Integer) getMendixObject().getValue(context, MemberNames.TickPadding.toString());
	}

	/**
	 * Set value of TickPadding
	 * @param tickpadding
	 */
	public final void setTickPadding(java.lang.Integer tickpadding)
	{
		setTickPadding(getContext(), tickpadding);
	}

	/**
	 * Set value of TickPadding
	 * @param context
	 * @param tickpadding
	 */
	public final void setTickPadding(com.mendix.systemwideinterfaces.core.IContext context, java.lang.Integer tickpadding)
	{
		getMendixObject().setValue(context, MemberNames.TickPadding.toString(), tickpadding);
	}

	/**
	 * @return value of TickRotation
	 */
	public final java.lang.Integer getTickRotation()
	{
		return getTickRotation(getContext());
	}

	/**
	 * @param context
	 * @return value of TickRotation
	 */
	public final java.lang.Integer getTickRotation(com.mendix.systemwideinterfaces.core.IContext context)
	{
		return (java.lang.Integer) getMendixObject().getValue(context, MemberNames.TickRotation.toString());
	}

	/**
	 * Set value of TickRotation
	 * @param tickrotation
	 */
	public final void setTickRotation(java.lang.Integer tickrotation)
	{
		setTickRotation(getContext(), tickrotation);
	}

	/**
	 * Set value of TickRotation
	 * @param context
	 * @param tickrotation
	 */
	public final void setTickRotation(com.mendix.systemwideinterfaces.core.IContext context, java.lang.Integer tickrotation)
	{
		getMendixObject().setValue(context, MemberNames.TickRotation.toString(), tickrotation);
	}

	/**
	 * @return the IMendixObject instance of this proxy for use in the Core interface.
	 */
	public final com.mendix.systemwideinterfaces.core.IMendixObject getMendixObject()
	{
		return axisBaseMendixObject;
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
			final nivodatavisualisation.proxies.AxisBase that = (nivodatavisualisation.proxies.AxisBase) obj;
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
