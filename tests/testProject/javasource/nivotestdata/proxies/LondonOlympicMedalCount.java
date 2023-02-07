// This file was generated by Mendix Studio Pro.
//
// WARNING: Code you write here will be lost the next time you deploy the project.

package nivotestdata.proxies;

public class LondonOlympicMedalCount
{
	private final com.mendix.systemwideinterfaces.core.IMendixObject londonOlympicMedalCountMendixObject;

	private final com.mendix.systemwideinterfaces.core.IContext context;

	/**
	 * Internal name of this entity
	 */
	public static final java.lang.String entityName = "NivoTestData.LondonOlympicMedalCount";

	/**
	 * Enum describing members of this entity
	 */
	public enum MemberNames
	{
		Country("Country"),
		Gold("Gold"),
		Silver("Silver"),
		Bronze("Bronze"),
		LondonOlympicMedalCount_ChartPlayground("NivoTestData.LondonOlympicMedalCount_ChartPlayground");

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

	public LondonOlympicMedalCount(com.mendix.systemwideinterfaces.core.IContext context)
	{
		this(context, com.mendix.core.Core.instantiate(context, entityName));
	}

	protected LondonOlympicMedalCount(com.mendix.systemwideinterfaces.core.IContext context, com.mendix.systemwideinterfaces.core.IMendixObject londonOlympicMedalCountMendixObject)
	{
		if (londonOlympicMedalCountMendixObject == null) {
			throw new java.lang.IllegalArgumentException("The given object cannot be null.");
		}
		if (!com.mendix.core.Core.isSubClassOf(entityName, londonOlympicMedalCountMendixObject.getType())) {
			throw new java.lang.IllegalArgumentException(String.format("The given object is not a %s", entityName));
		}	

		this.londonOlympicMedalCountMendixObject = londonOlympicMedalCountMendixObject;
		this.context = context;
	}

	/**
	 * @deprecated Use 'LondonOlympicMedalCount.load(IContext, IMendixIdentifier)' instead.
	 */
	@java.lang.Deprecated
	public static nivotestdata.proxies.LondonOlympicMedalCount initialize(com.mendix.systemwideinterfaces.core.IContext context, com.mendix.systemwideinterfaces.core.IMendixIdentifier mendixIdentifier) throws com.mendix.core.CoreException
	{
		return nivotestdata.proxies.LondonOlympicMedalCount.load(context, mendixIdentifier);
	}

	/**
	 * Initialize a proxy using context (recommended). This context will be used for security checking when the get- and set-methods without context parameters are called.
	 * The get- and set-methods with context parameter should be used when for instance sudo access is necessary (IContext.createSudoClone() can be used to obtain sudo access).
	 * @param context The context to be used
	 * @param mendixObject The Mendix object for the new instance
	 * @return a new instance of this proxy class
	 */
	public static nivotestdata.proxies.LondonOlympicMedalCount initialize(com.mendix.systemwideinterfaces.core.IContext context, com.mendix.systemwideinterfaces.core.IMendixObject mendixObject)
	{
		return new nivotestdata.proxies.LondonOlympicMedalCount(context, mendixObject);
	}

	public static nivotestdata.proxies.LondonOlympicMedalCount load(com.mendix.systemwideinterfaces.core.IContext context, com.mendix.systemwideinterfaces.core.IMendixIdentifier mendixIdentifier) throws com.mendix.core.CoreException
	{
		com.mendix.systemwideinterfaces.core.IMendixObject mendixObject = com.mendix.core.Core.retrieveId(context, mendixIdentifier);
		return nivotestdata.proxies.LondonOlympicMedalCount.initialize(context, mendixObject);
	}

	public static java.util.List<nivotestdata.proxies.LondonOlympicMedalCount> load(com.mendix.systemwideinterfaces.core.IContext context, java.lang.String xpathConstraint) throws com.mendix.core.CoreException
	{
		return com.mendix.core.Core.createXPathQuery(String.format("//%1$s%2$s", entityName, xpathConstraint))
			.execute(context)
			.stream()
			.map(obj -> nivotestdata.proxies.LondonOlympicMedalCount.initialize(context, obj))
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
	 * @return value of Country
	 */
	public final java.lang.String getCountry()
	{
		return getCountry(getContext());
	}

	/**
	 * @param context
	 * @return value of Country
	 */
	public final java.lang.String getCountry(com.mendix.systemwideinterfaces.core.IContext context)
	{
		return (java.lang.String) getMendixObject().getValue(context, MemberNames.Country.toString());
	}

	/**
	 * Set value of Country
	 * @param country
	 */
	public final void setCountry(java.lang.String country)
	{
		setCountry(getContext(), country);
	}

	/**
	 * Set value of Country
	 * @param context
	 * @param country
	 */
	public final void setCountry(com.mendix.systemwideinterfaces.core.IContext context, java.lang.String country)
	{
		getMendixObject().setValue(context, MemberNames.Country.toString(), country);
	}

	/**
	 * @return value of Gold
	 */
	public final java.lang.Integer getGold()
	{
		return getGold(getContext());
	}

	/**
	 * @param context
	 * @return value of Gold
	 */
	public final java.lang.Integer getGold(com.mendix.systemwideinterfaces.core.IContext context)
	{
		return (java.lang.Integer) getMendixObject().getValue(context, MemberNames.Gold.toString());
	}

	/**
	 * Set value of Gold
	 * @param gold
	 */
	public final void setGold(java.lang.Integer gold)
	{
		setGold(getContext(), gold);
	}

	/**
	 * Set value of Gold
	 * @param context
	 * @param gold
	 */
	public final void setGold(com.mendix.systemwideinterfaces.core.IContext context, java.lang.Integer gold)
	{
		getMendixObject().setValue(context, MemberNames.Gold.toString(), gold);
	}

	/**
	 * @return value of Silver
	 */
	public final java.lang.Integer getSilver()
	{
		return getSilver(getContext());
	}

	/**
	 * @param context
	 * @return value of Silver
	 */
	public final java.lang.Integer getSilver(com.mendix.systemwideinterfaces.core.IContext context)
	{
		return (java.lang.Integer) getMendixObject().getValue(context, MemberNames.Silver.toString());
	}

	/**
	 * Set value of Silver
	 * @param silver
	 */
	public final void setSilver(java.lang.Integer silver)
	{
		setSilver(getContext(), silver);
	}

	/**
	 * Set value of Silver
	 * @param context
	 * @param silver
	 */
	public final void setSilver(com.mendix.systemwideinterfaces.core.IContext context, java.lang.Integer silver)
	{
		getMendixObject().setValue(context, MemberNames.Silver.toString(), silver);
	}

	/**
	 * @return value of Bronze
	 */
	public final java.lang.Integer getBronze()
	{
		return getBronze(getContext());
	}

	/**
	 * @param context
	 * @return value of Bronze
	 */
	public final java.lang.Integer getBronze(com.mendix.systemwideinterfaces.core.IContext context)
	{
		return (java.lang.Integer) getMendixObject().getValue(context, MemberNames.Bronze.toString());
	}

	/**
	 * Set value of Bronze
	 * @param bronze
	 */
	public final void setBronze(java.lang.Integer bronze)
	{
		setBronze(getContext(), bronze);
	}

	/**
	 * Set value of Bronze
	 * @param context
	 * @param bronze
	 */
	public final void setBronze(com.mendix.systemwideinterfaces.core.IContext context, java.lang.Integer bronze)
	{
		getMendixObject().setValue(context, MemberNames.Bronze.toString(), bronze);
	}

	/**
	 * @throws com.mendix.core.CoreException
	 * @return value of LondonOlympicMedalCount_ChartPlayground
	 */
	public final nivotestdata.proxies.ChartPlayground getLondonOlympicMedalCount_ChartPlayground() throws com.mendix.core.CoreException
	{
		return getLondonOlympicMedalCount_ChartPlayground(getContext());
	}

	/**
	 * @param context
	 * @return value of LondonOlympicMedalCount_ChartPlayground
	 * @throws com.mendix.core.CoreException
	 */
	public final nivotestdata.proxies.ChartPlayground getLondonOlympicMedalCount_ChartPlayground(com.mendix.systemwideinterfaces.core.IContext context) throws com.mendix.core.CoreException
	{
		nivotestdata.proxies.ChartPlayground result = null;
		com.mendix.systemwideinterfaces.core.IMendixIdentifier identifier = getMendixObject().getValue(context, MemberNames.LondonOlympicMedalCount_ChartPlayground.toString());
		if (identifier != null) {
			result = nivotestdata.proxies.ChartPlayground.load(context, identifier);
		}
		return result;
	}

	/**
	 * Set value of LondonOlympicMedalCount_ChartPlayground
	 * @param londonolympicmedalcount_chartplayground
	 */
	public final void setLondonOlympicMedalCount_ChartPlayground(nivotestdata.proxies.ChartPlayground londonolympicmedalcount_chartplayground)
	{
		setLondonOlympicMedalCount_ChartPlayground(getContext(), londonolympicmedalcount_chartplayground);
	}

	/**
	 * Set value of LondonOlympicMedalCount_ChartPlayground
	 * @param context
	 * @param londonolympicmedalcount_chartplayground
	 */
	public final void setLondonOlympicMedalCount_ChartPlayground(com.mendix.systemwideinterfaces.core.IContext context, nivotestdata.proxies.ChartPlayground londonolympicmedalcount_chartplayground)
	{
		if (londonolympicmedalcount_chartplayground == null) {
			getMendixObject().setValue(context, MemberNames.LondonOlympicMedalCount_ChartPlayground.toString(), null);
		} else {
			getMendixObject().setValue(context, MemberNames.LondonOlympicMedalCount_ChartPlayground.toString(), londonolympicmedalcount_chartplayground.getMendixObject().getId());
		}
	}

	/**
	 * @return the IMendixObject instance of this proxy for use in the Core interface.
	 */
	public final com.mendix.systemwideinterfaces.core.IMendixObject getMendixObject()
	{
		return londonOlympicMedalCountMendixObject;
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
			final nivotestdata.proxies.LondonOlympicMedalCount that = (nivotestdata.proxies.LondonOlympicMedalCount) obj;
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
