import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
    SearchkitClient,
    useSearchkit,
    useSearchkitVariables,
    withSearchkit,
} from "@searchkit/client";
import { Pagination } from "@ecds/searchkit-elastic-ui";
import {
    EuiPage,
    EuiPageBody,
    EuiPageContent,
    EuiPageContentBody,
    EuiPageContentHeader,
    EuiPageContentHeaderSection,
    EuiPageHeader,
    EuiPageHeaderSection,
    EuiPageSideBar,
    EuiTitle,
    EuiHorizontalRule,
    EuiFlexGroup,
    EuiButton,
} from "@elastic/eui";
import "@elastic/eui/dist/eui_theme_light.css";
import { appendIconComponentCache } from "@elastic/eui/es/components/icon/icon";
import { icon as EuiIconArrowLeft } from "@elastic/eui/es/components/icon/assets/arrow_left";
import { icon as EuiIconArrowRight } from "@elastic/eui/es/components/icon/assets/arrow_right";
import { icon as EuiIconCross } from "@elastic/eui/es/components/icon/assets/cross";
import { icon as EuiIconSearch } from "@elastic/eui/es/components/icon/assets/search";
import { icon as EuiIconQuestion } from "@elastic/eui/es/components/icon/assets/question_in_circle";
import {
    analyzers,
    entitiesSearchConfig,
    fields,
    scopeOptions,
} from "./entitiesSearchConfig";
import EntitiesResults from "../../components/EntitiesResults";
import ListFacet from "../../components/ListFacet";
import { SearchControls } from "../../components/SearchControls";
import {
    routeToState,
    stateToRoute,
    useCustomSearchkitSDK,
    useScope,
} from "../../common";
import ValueFilter from "../../components/ValueFilter";

// icon component cache required for dynamically imported EUI icons in Vite;
// see https://github.com/elastic/eui/issues/5463
appendIconComponentCache({
    arrowLeft: EuiIconArrowLeft,
    arrowRight: EuiIconArrowRight,
    cross: EuiIconCross,
    search: EuiIconSearch,
    questionInCircle: EuiIconQuestion,
});

/**
 * Entities search page.
 *
 * @returns React entities search page component
 */
function EntitiesSearch() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [query, setQuery] = useState(() => (searchParams.has("query") ? searchParams.get("query") : ""));
    const [operator, setOperator] = useState("or");
    const [scope, setScope] = useScope();
    const api = useSearchkit();
    const variables = useSearchkitVariables();
    const { results, loading } = useCustomSearchkitSDK({
        analyzers,
        config: entitiesSearchConfig,
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

    return (
        <main className="search-page">
            <EuiPage paddingSize="l">
                <aside>
                    <EuiPageSideBar>
                        <SearchControls
                            loading={loading}
                            onSearch={(value) => {
                                setQuery(value);
                                setSearchParams(
                                    stateToRoute({
                                        ...variables,
                                        scope,
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
                        {results?.facets.map((facet) => (
                            <ListFacet
                                key={facet.identifier}
                                facet={facet}
                                loading={loading}
                            />
                        ))}
                    </EuiPageSideBar>
                </aside>
                <EuiPageBody component="section">
                    <EuiPageHeader>
                        <EuiPageHeaderSection className="active-facet-group">
                            <EuiTitle size="l">
                                <EuiFlexGroup
                                    gutterSize="s"
                                    alignItems="center"
                                >
                                    {results?.summary?.appliedFilters.map(
                                        (filter) => (
                                            <ValueFilter
                                                key={filter.id}
                                                filter={filter}
                                                loading={loading}
                                            />
                                        ),
                                    )}
                                </EuiFlexGroup>
                            </EuiTitle>
                        </EuiPageHeaderSection>
                        <EuiPageHeaderSection>
                            <EuiButton
                                fill
                                color="text"
                                className="reset-search"
                                disabled={!api.canResetSearch()}
                                isLoading={loading}
                                onClick={() => {
                                    // reset query and filters
                                    setQuery("");
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
                        </EuiPageHeaderSection>
                    </EuiPageHeader>
                    <EuiPageContent>
                        <EuiPageContentHeader>
                            <EuiPageContentHeaderSection>
                                <EuiTitle size="s">
                                    <h2>
                                        {results?.summary.total}
                                        {" "}
                                        Results
                                    </h2>
                                </EuiTitle>
                            </EuiPageContentHeaderSection>
                        </EuiPageContentHeader>
                        {results?.summary?.total > 0 ? (
                            <EuiPageContentBody>
                                <EntitiesResults
                                    data={results}
                                    offset={variables?.page?.from}
                                />
                                <EuiFlexGroup justifyContent="spaceAround">
                                    <Pagination data={results} />
                                </EuiFlexGroup>
                            </EuiPageContentBody>
                        ) : (
                            <EuiPageContentBody>
                                {loading
                                    ? "Loading..."
                                    : "Your search did not return any results."}
                            </EuiPageContentBody>
                        )}
                    </EuiPageContent>
                </EuiPageBody>
            </EuiPage>
        </main>
    );
}

export const EntitiesSearchPage = withSearchkit(
    EntitiesSearch,
    () => new SearchkitClient({ itemsPerPage: 25 }),
);
