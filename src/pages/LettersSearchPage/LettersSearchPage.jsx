import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
    SearchkitClient,
    useSearchkit,
    useSearchkitVariables,
    withSearchkit,
} from "@searchkit/client";
import {
    EuiPage,
    EuiPageBody,
    EuiPageSection,
    EuiPageHeader,
    EuiPageSidebar,
    EuiTitle,
    EuiHorizontalRule,
    EuiFlexGroup,
    EuiSpacer,
    EuiButton,
    EuiHeaderSection,
    EuiHeaderSectionItem,
} from "@elastic/eui";
import { appendIconComponentCache } from "@elastic/eui/es/components/icon/icon";
import { icon as EuiIconArrowDown } from "@elastic/eui/es/components/icon/assets/arrow_down";
import { icon as EuiIconArrowLeft } from "@elastic/eui/es/components/icon/assets/arrow_left";
import { icon as EuiIconArrowRight } from "@elastic/eui/es/components/icon/assets/arrow_right";
import { icon as EuiIconCross } from "@elastic/eui/es/components/icon/assets/cross";
import { icon as EuiIconCalendar } from "@elastic/eui/es/components/icon/assets/calendar";
import { icon as EuiIconSearch } from "@elastic/eui/es/components/icon/assets/search";
import { icon as EuiIconSortable } from "@elastic/eui/es/components/icon/assets/sortable";
import { icon as EuiIconSortUp } from "@elastic/eui/es/components/icon/assets/sort_up";
import { icon as EuiIconSortDown } from "@elastic/eui/es/components/icon/assets/sort_down";
import {
    lettersSearchConfig,
    analyzers,
    fields,
    scopeOptions,
} from "./lettersSearchConfig";
import LettersResults from "../../components/LettersResults";
import ListFacet from "../../components/ListFacet";
import ValueFilter from "../../components/ValueFilter";
import DateRangeFacet from "../../components/DateRangeFacet";
import "../../common/search.css";
import SaveSearchButton from "../../components/SaveSearchButton";
import { SearchControls } from "../../components/SearchControls";
import {
    getSortByFromState,
    routeToState,
    stateToRoute,
    useCustomSearchkitSDK,
    useScope,
} from "../../common";
import { useDateFilter } from "./useDateFilter";
import "./LettersSearchPage.css";
import { Pagination } from "../../components/Pagination";

// icon component cache required for dynamically imported EUI icons in Vite;
// see https://github.com/elastic/eui/issues/5463
appendIconComponentCache({
    arrowLeft: EuiIconArrowLeft,
    arrowRight: EuiIconArrowRight,
    arrowDown: EuiIconArrowDown,
    calendar: EuiIconCalendar,
    cross: EuiIconCross,
    search: EuiIconSearch,
    sortable: EuiIconSortable,
    sortUp: EuiIconSortUp,
    sortDown: EuiIconSortDown,
});

/**
 * Letters search page.
 *
 * @returns React letters search page component
 */
function LettersSearch() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [query, setQuery] = useState(() =>
        searchParams.has("query") ? searchParams.get("query") : "",
    );
    const [operator, setOperator] = useState(
        searchParams.has("op") ? searchParams.get("op") : "or",
    );
    const [dateRangeState, setDateRangeState] = useDateFilter();
    const [scope, setScope] = useScope();
    const sortStateMounted = useRef(false);
    const [sortState, setSortState] = useState(() => {
        if (searchParams?.has("sort")) {
            const [field, dir] = searchParams.get("sort").split("_");
            const direction = dir === "asc" ? 1 : -1;
            return { field, direction };
        }
        // default sort: date asc
        return {
            field: "date",
            direction: 1,
        };
    });
    /**
     * Curried event listener funciton to set the sort state to a given field.
     *
     * @param {string} field The name of the field to sort on.
     * @returns {Function} The event listner function.
     */
    const onSort = (field) => () => {
        if (sortState.field === field) {
            setSortState((prevState) => ({
                field,
                direction: -1 * prevState.direction,
            }));
        } else {
            setSortState({ field, direction: 1 });
        }
    };
    const api = useSearchkit();
    const variables = useSearchkitVariables();
    const { results, loading, dateRange, dateRangeLoading } =
        useCustomSearchkitSDK({
            analyzers,
            config: lettersSearchConfig,
            fields,
            operator,
        });

    // Use React Router useSearchParams to translate to and from URL query params
    useEffect(() => {
        if (api && searchParams) {
            api.setSearchState(routeToState(searchParams));
            api.search();
        }
    }, [searchParams]);
    useEffect(() => {
        // handle sorting separately in order to only update in case of changes
        // use mounted ref to ensure we don't fire this effect on initial value
        if (!sortStateMounted.current) {
            sortStateMounted.current = true;
        } else if (sortState) {
            const sortBy = getSortByFromState(sortState);
            if (
                !searchParams.has("sort") ||
                searchParams.get("sort") !== sortBy
            ) {
                setSearchParams(
                    stateToRoute({
                        ...variables,
                        query,
                        sortBy,
                        scope,
                        operator,
                    }),
                );
            }
        }
    }, [sortState]);
    useEffect(() => {
        if (
            operator &&
            searchParams &&
            ((!searchParams.has("op") && operator !== "or") ||
                (searchParams.has("op") && searchParams.get("op") !== operator))
        ) {
            setSearchParams(
                stateToRoute({
                    ...variables,
                    query,
                    sortBy: getSortByFromState(sortState),
                    scope,
                    operator,
                    page: {
                        from: 0, // reset page to 0 on operator change; could exclude results!
                    },
                }),
            );
        }
    }, [operator]);
    useEffect(() => {
        if (variables?.page?.from) {
            setSearchParams(
                stateToRoute({
                    ...variables,
                    query,
                    sortBy: getSortByFromState(sortState),
                    scope,
                    operator,
                    page: {
                        from: variables.page.from,
                    },
                }),
            );
        }
    }, [variables?.page?.from]);

    return (
        <main className="search-page">
            <EuiPage paddingSize="l">
                <aside>
                    <EuiPageSidebar>
                        <SearchControls
                            loading={loading}
                            onSearch={(value) => {
                                setQuery(value);
                                setSearchParams(
                                    stateToRoute({
                                        ...variables,
                                        scope,
                                        operator,
                                        query: value,
                                        page: {
                                            from: 0,
                                        },
                                    }),
                                );
                            }}
                            operator={operator}
                            setOperator={setOperator}
                            setQuery={setQuery}
                            query={query}
                            scopeOptions={scopeOptions}
                            scope={scope}
                            setScope={setScope}
                        />
                        <EuiHorizontalRule margin="m" />
                        <DateRangeFacet
                            minDate={dateRange?.minDate}
                            maxDate={dateRange?.maxDate}
                            loading={dateRangeLoading || loading}
                            dateRange={dateRangeState}
                            setDateRange={setDateRangeState}
                        />
                        <EuiSpacer size="l" />
                        {results?.facets
                            .filter(
                                (facet) =>
                                    facet.display &&
                                    facet.display !== "CustomDateFacet",
                            )
                            .map((facet) => (
                                <div key={facet.identifier}>
                                    <ListFacet
                                        data={results}
                                        facet={facet}
                                        loading={loading}
                                        textSearchable={
                                            facet.identifier === "repository"
                                        }
                                    />
                                    <EuiSpacer size="l" />
                                </div>
                            ))}
                    </EuiPageSidebar>
                </aside>
                <EuiPageSection className="search-results-panel">
                    <EuiPageHeader>
                        <EuiHeaderSectionItem className="active-facet-group ">
                            <EuiTitle size="l">
                                <EuiFlexGroup
                                    gutterSize="s"
                                    alignItems="center"
                                >
                                    {results?.summary?.appliedFilters
                                        .filter(
                                            (f) =>
                                                !f.identifier.endsWith("_date"),
                                        )
                                        .map((filter) => (
                                            <ValueFilter
                                                filter={filter}
                                                loading={loading}
                                                key={filter.id}
                                            />
                                        ))}
                                </EuiFlexGroup>
                            </EuiTitle>
                        </EuiHeaderSectionItem>
                        <EuiHeaderSection>
                            <EuiButton
                                fill
                                color="text"
                                className="reset-search"
                                disabled={!api.canResetSearch()}
                                isLoading={loading}
                                onClick={() => {
                                    // reset query and date range
                                    setQuery("");
                                    api.setQuery("");
                                    setDateRangeState({
                                        startDate: null,
                                        endDate: null,
                                    });
                                    setSearchParams(
                                        stateToRoute({
                                            filters: [],
                                            query: "",
                                        }),
                                    );
                                }}
                            >
                                Reset Search
                            </EuiButton>
                            <SaveSearchButton />
                        </EuiHeaderSection>
                    </EuiPageHeader>
                    <EuiPageBody panelled component="section">
                        {results?.summary?.total > 0 ? (
                            <EuiPageSection>
                                <EuiTitle size="s">
                                    <h2 className="result-count">
                                        {results?.summary.total} Results
                                    </h2>
                                </EuiTitle>
                                <LettersResults
                                    data={results}
                                    offset={variables?.page?.from}
                                    onSort={onSort}
                                    sortState={sortState}
                                />
                                <EuiFlexGroup justifyContent="spaceAround">
                                    <Pagination data={results} />
                                </EuiFlexGroup>
                            </EuiPageSection>
                        ) : (
                            <EuiPageSection>
                                {loading
                                    ? "Loading..."
                                    : "Your search did not return any results."}
                            </EuiPageSection>
                        )}
                    </EuiPageBody>
                </EuiPageSection>
            </EuiPage>
        </main>
    );
}

export const LettersSearchPage = withSearchkit(
    LettersSearch,
    () => new SearchkitClient({ itemsPerPage: 25 }),
);
