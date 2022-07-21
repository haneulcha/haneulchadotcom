import styles from '@/styles/About.module.css';
import { useRouter } from 'next/router';
function About() {
  const router = useRouter();
  return (
    <main className={styles.main}>
      <div className={styles.contentWrapper}>
        <div className={styles.titlebar}>
          <div className={styles.buttonWrapper}>
            <button className={styles.close} onClick={() => router.back()}>
              <strong className={styles.inlineContent}></strong>
            </button>

            <button className={styles.minimize}>
              <strong className={styles.inlineContent}></strong>
            </button>

            <button className={styles.zoom}>
              <strong className={styles.inlineContent}></strong>
            </button>
          </div>
          이력서
        </div>
        <article className={styles.content}>
          <h1>차하늘</h1>

          <table className={styles.info}>
            <caption>개인 정보와 관련 링크</caption>
            <tr key="info-table-1">
              <td scope="row">Contact</td>
              <td>
                <a href="mailto:tjaneul@gmail.com">tjaneul@gmail.com</a>
              </td>
            </tr>
            <tr key="info-table-2">
              <td scope="row">Homepage&nbsp;</td>
              <td>
                <a
                  href="https://haneulcha.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  https://haneulcha.com/
                </a>
              </td>
            </tr>
            <tr key="info-table-3">
              <td scope="row">Github&nbsp;</td>
              <td>
                <a
                  href="https://github.com/haneulcha"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  https://github.com/haneulcha
                </a>
              </td>
            </tr>
            <tr key="info-table-4">
              <td scope="row">Blog&nbsp;</td>
              <td>
                <a
                  href="https://kicksky.tistory.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  https://kicksky.tistory.com/
                </a>
              </td>
            </tr>
          </table>

          <h2>소개</h2>
          <p>
            나의 일을 스스로 정의하고자 하는 프론트엔드 개발자 차하늘 입니다.
            개발자와 코딩이라는, 주어진 직책과 업무에 얽매이지 않을 때 더 좋은
            동료가 될 수 있다고 생각합니다. 코드만큼이나 유저와 프로덕트를
            가까이하고 깊이 고민해야만 개발자로서 스스로 작성하는 코드에
            정당성과 근거를 마련할 수 있고, 결국 더 좋은 프로덕트를 유저에게
            제공할 수 있는 선순환을 이룰 수 있기 때문입니다. 단순히 할 수 있는
            것을 하는 맥락 없는 올라운더가 아니라, 필요한 것을 함으로써 스스로
            영역을 넓히고 깊이를 더할 수 있는 개발자가 되고자 합니다.
          </p>

          <h2>경력</h2>
          <h3>데브언리밋</h3>

          <table className={styles.info}>
            <tr key="info-table-1">
              <td scope="row">기간</td>
              <td>2021. 5 ~ 현재 (1년 3개월)</td>
            </tr>
            <tr key="info-table-2">
              <td scope="row">업무</td>
              <td>프론트엔드, 유저 사일로</td>
            </tr>
            <tr key="info-table-3">
              <td scope="row">
                <strong>기술</strong>
              </td>
              <td> Next.js, Typescript, emotion, zustand, AWS</td>
            </tr>
          </table>

          <section className={styles.experienceSection}>
            <h4>
              <a
                href="https://www.sparky.tv"
                target="_blank"
                rel="noopener noreferrer"
              >
                Sparky.tv
              </a>
              &nbsp;기능 개발 및 UI/UX 개선<span>(2021. 7 ~ )</span>
            </h4>
            <p>
              모션 트래킹 기반의 인터랙티브 영상을 통해 유저가 운동과 댄스를
              경험하는 글로벌 홈 트레이닝 플랫폼
            </p>

            <p>
              <span>기술 스택</span>
              Next.js (SSR), Serverless Framework (AWS Lambda@edge), emotion,
              mobX, zustand, tfjs
            </p>

            <ul>
              <li>
                <details>
                  <summary>유저 사용성과 재방문을 위한 기능 개발</summary>
                  <ul>
                    <li>
                      유저 및 크리에이터 개인 페이지 (Next.js Dynamic Route)
                    </li>
                    <li>UX를 고려한 카테고리 및 태그 필터</li>
                    <li>게임성 부각을 위한 다크 테마 등 UI 디자인 전환</li>
                    <li>
                      이벤트 진행 사이클에 따른 분기 처리를 반영한 이벤트 및
                      랭킹 기능 및 관련 UI 개발
                    </li>
                    <li>
                      유저 경험과 직접 맞닿는 작업들에 대해 디자인 팀과&nbsp;
                      <a
                        href="https://kicksky.tistory.com/103"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        긴밀한 협업
                      </a>
                      &nbsp;및 피드백 진행
                    </li>
                  </ul>
                </details>
              </li>

              <li>
                <details>
                  <summary>지속적인 UI/UX 개선</summary>
                  <ul>
                    <li>웹 표준과 접근성을 고려</li>
                    <li>시맨틱 마크업, 최신 CSS 스펙을 반영 </li>
                    <li>i18n까지 고려한 반응형 디자인 개발</li>
                  </ul>
                </details>
              </li>

              <li>
                <details>
                  <summary>데이터 및 로그 수집</summary>
                  <ul>
                    <li>
                      에러 로그 수집을 위한
                      <a
                        href="https://kicksky.tistory.com/111"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        &nbsp;Sentry 도입
                      </a>
                      &nbsp;및 로그 관리
                    </li>
                    <li>
                      서비스 내 유저 상호작용 이벤트 추적 및 데이터 수집을 위한
                      구글 태그 매니저 관리
                    </li>
                  </ul>
                </details>
              </li>
            </ul>
          </section>
          <section className={styles.experienceSection}>
            <h4>
              {/* <a
                href="https://studio.sparky.tv/"
                target="_blank"
                rel="noopener noreferrer"
              > */}
              Sparky.tv Studio
              {/* </a> */}
              &nbsp;코드 개선<span>(2022. 7)</span>
            </h4>

            <p>
              크리에이터가 Sparky.tv에 영상을 업로드 및 설정하여 모션 트래킹
              분석을 요청하는 웹 어플리케이션
            </p>

            <p>
              <span>기술 스택</span>React, Typescript
            </p>

            <ul>
              <li>
                <details>
                  <summary>유저(크리에이터) 사용성 개선</summary>
                  <ul>
                    <li>
                      설계 상 오류로 인해 유저 경험에 영향을 주었던 문제를 UX
                      개선을 통해 해결
                    </li>
                    <li>2년 전 초기 레거시 코드 리팩토링, 코드 품질 개선</li>
                  </ul>
                </details>
              </li>
            </ul>
          </section>
          <section className={styles.experienceSection}>
            <h4>
              <a
                href="https://develup.devunlimit.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                DevelUp
              </a>
              &nbsp;정적 웹 사이트 제작 및 배포<span>(2021. 6, 11)</span>
            </h4>

            <p>사내 SI 프로젝트의 포트폴리오 및 홍보를 위한 정적 웹 사이트</p>

            <p>
              <span>기술 스택</span>Next.js (SSG), AWS S3, CloudFront, DynamoDB,
              react-hook-form
            </p>

            <ul>
              <li>
                <details>
                  <summary>설계 ~ 배포</summary>
                  <ul>
                    <li>
                      프로덕트 성격을 고려하여 Next.js의 Static Generation으로
                      페이지 구성 및 빌드
                    </li>
                    <li>Github Actions를 사용해 CI/CD 구성</li>
                    <li>
                      AWS S3 및 CloudFront, Route53을 통해 정적 웹 페이지 호스팅
                    </li>
                  </ul>
                </details>
              </li>
              <li>
                <details>
                  <summary>자동화 기능 개발</summary>
                  <ul>
                    <li>
                      배포 이후 사내 백 오피스 개발에 참여하여 포트폴리오
                      업데이트 및 배포 등 자동화 진행
                    </li>
                    <li>포트폴리오 CRUD, Webhook 통한 제3자 배포</li>
                  </ul>
                </details>
              </li>
            </ul>
          </section>
          <section className={styles.experienceSection}>
            <h4>사내 백 오피스 개발</h4>
            <p>사내에서 필요한 업무와 관리를 위한 툴을 기능 단위로 개발</p>
            <p>
              <span>기술 스택</span>React, react-hook-form
            </p>

            <ul>
              <li>
                <details>
                  <summary>프로덕트 및 마케팅 팀 지원을 위한 기능</summary>
                  <ul>
                    <li>
                      마케팅 팀이 수집한 자료를 DB로 마이그레이션 (Youtube API,
                      DynamoDB)
                    </li>
                    <li>회사 연혁 및 정보 아카이브</li>
                    <li>SI 포트폴리오 관리 및 웹 페이지 배포</li>
                  </ul>
                </details>
              </li>
            </ul>
          </section>

          <h2>개인 프로젝트</h2>
          <section className={styles.experienceSection}>
            <h4>
              <a
                href="https://github.com/haneulcha/galpi"
                target="_blank"
                rel="noopener noreferrer"
              >
                갈피
              </a>
              <span>(2020. 7 ~ 12)</span>
            </h4>
            <p>
              좋아하는 책의 글귀를 발췌하고 편집하여 이미지 카드로 업로드 할 수
              있는 소셜 웹 어플리케이션
            </p>
            <p>
              <span>기술 스택</span>React, redux, react-router, Node.js/Express,
              MongoDB
            </p>
          </section>
          <section className={styles.experienceSection}>
            <h4>
              <a
                href="https://github.com/haneulcha/kinderguri"
                target="_blank"
                rel="noopener noreferrer"
              >
                킨더구리
              </a>
              <span>(2020. 4 ~ 5)</span>
            </h4>
            <p>
              구리시에 위치한 유치원과 어린이집에 대한 정보와 위치를 검색할 수
              있는 웹 어플리케이션
            </p>
            <p>
              <span>기술 스택</span>React, Apollo Server/Client, Open API,
              KakaoMap API
            </p>
          </section>
          <h2>언어</h2>
          <section className={styles.language}>
            <ul>
              <li>
                <span>영어</span> TOEIC 980. 공식 기술 문서와 스택오버플로우 등
                필요한 정보를 원문 검색, 협업을 위한 회화가 가능한 수준
              </li>
              <li>
                <span>독일어</span> B2. 원문 독해와 일상 대화 가능한 수준
              </li>
            </ul>
          </section>
        </article>
      </div>
    </main>
  );
}

export default About;
