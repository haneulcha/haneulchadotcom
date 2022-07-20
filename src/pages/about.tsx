import styles from '@/styles/About.module.css';
function About() {
  return (
    <main className={styles.main}>
      <div className={styles.contentWrapper}>
        <div className={styles.titlebar}>
          <div className={styles.buttonWrapper}>
            <button className={styles.close}>
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

          <h2>소개</h2>
          <p>
            나의 일을 스스로 정의하고자 하는 프론트엔드 개발자 차하늘 입니다.
            개발자와 코딩이라는, 주어진 직책과 업무에 얽매이지 않을 때 더 좋은
            동료가 될 수 있다고 생각합니다. 코드만큼이나 유저와 프로덕트를
            가까이하고 깊이 고민해야만 개발자로서 스스로 작성하는 코드에
            정당성과 근거를 마련할 수 있고, 결국 더 좋은 프로덕트를 유저에게
            제공할 수 있는 선순환을 이룰 수 있기 때문입니다. 단순히 할 수 있는
            것을 하는 맥락 없는 올라운더가 아니라, 필요한 것을 함으로써 스스로
            영역을 넓히고 깊이를 더할 수 있는 프론트엔드 개발자가 되고자 합니다.
          </p>
          <section className={styles.info}>
            <div>
              Contact: <a href="mailto:tjaneul@gmail.com">tjaneul@gmail.com</a>
            </div>
            <div>
              Homepage:&nbsp;
              <a
                href="https://haneulcha.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                https://haneulcha.com
              </a>
            </div>
            <div>
              Github:&nbsp;
              <a
                href="https://github.com/haneulcha"
                target="_blank"
                rel="noopener noreferrer"
              >
                https://github.com/haneulcha
              </a>
            </div>
            <div>
              Blog:&nbsp;
              <a
                href="https://kicksky.tistory.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                https://kicksky.tistory.com/
              </a>
            </div>
          </section>

          <h2>경력</h2>
          <h3>데브언리밋</h3>
          <p>
            프론트엔드 담당
            <br />
            유저 사일로 Sparky.tv 신규 기능 및 UI 개발, Sparky Studio 코드 개선
            <br />
            Next.js, Typescript, emotion, zustand
          </p>

          <section className={styles.experienceSection}>
            <span>2021. 7 ~ </span>
            <h4>
              <a
                href="https://www.sparky.tv"
                target="_blank"
                rel="noopener noreferrer"
              >
                Sparky.tv
              </a>
              &nbsp;기능 개발 및 UI/UX 개선
            </h4>

            <table>
              <tbody>
                <tr>
                  <th>2021. 7 ~</th>
                  <th>
                    모션 트래킹 기반의 인터랙티브 영상을 통해 유저가 운동과
                    댄스를 경험하는 글로벌 홈 트레이닝 플랫폼
                  </th>
                </tr>
                <tr>
                  <th>기술</th>
                  <th>
                    Next.js(SSR), Serverless Framework (AWS Lambda@edge), styled
                    component, mobX, zustand, tfjs, hls.js
                  </th>
                </tr>
              </tbody>
            </table>
            <p>
              모션 트래킹 기반의 인터랙티브 영상을 통해 유저가 운동과 댄스를
              경험하는 글로벌 홈 트레이닝 플랫폼
            </p>

            <p>
              기술 스택: Next.js(SSR), Serverless Framework (AWS Lambda@edge),
              styled component, mobX, zustand, tfjs, hls.js
            </p>

            <ul>
              <li>
                <details open>
                  <summary>유저 사용성과 재방문을 위한 기능 개발</summary>
                  <ul>
                    <li>
                      UX를 고려한 카테고리 및 태그 필터, Next.js의 Dynamic
                      Route를 활용한 유저 및 크리에이터 개인 페이지, 게임성을
                      살리는 다크 테마 등 UI 디자인 전환
                    </li>
                    <li>
                      이벤트 조건 및 진행 사이클을 고려한 이벤트 및 랭킹 기능 및
                      관련 UI 개발
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
                <details open>
                  <summary>지속적인 UI/UX 개선</summary>
                  <ul>
                    <li>
                      웹 표준과 접근성을 준수하고 i18n를 고려한 UI/UX 개선
                    </li>
                    <li>시맨틱 마크업 작성과 최신 CSS 스펙을 최대한 반영 </li>
                  </ul>
                </details>
              </li>

              <li>
                <details open>
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
          <h4>
            <span>2022. 7 ~ </span>
            <a
              href="https://studio.sparky.tv/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Sparky.tv Studio
            </a>
            &nbsp;코드 개선
          </h4>

          <p>
            크리에이터가 Sparky.tv에 영상을 업로드하고 모션 트래킹 분석을
            요청하는 웹 어플리케이션
          </p>

          <p>기술 스택: React, Typescript, video.js</p>

          <ul>
            <li>
              <details open>
                <summary>유저(크리에이터) 사용성 개선</summary>
                <ul>
                  <li>
                    설계 상 오류로 인해 유저 경험을 떨어트렸던 문제를 UX 상의
                    장치를 통해 해결
                  </li>
                  <li>
                    2년 전 프로덕트 초기 레거시 코드 리팩토링을 통해 코드 품질
                    및 UX 개선
                  </li>
                </ul>
              </details>
            </li>
          </ul>
          <h4>
            <a
              href="https://develup.devunlimit.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              DevelUp
            </a>
            &nbsp;정적 웹 사이트 제작 및 배포 (2021. 6, 2021. 11)
          </h4>

          <p>회사 내 SI 프로젝트의 포트폴리오 및 홍보를 위한 정적 웹 사이트</p>

          <p>기술 스택: Next.js(SSG), AWS S3, CloudFront, DynamoDB</p>

          <ul>
            <li>
              <details open>
                <summary>웹 사이트의 설계부터 배포까지의 사이클 전담</summary>
                <ul>
                  <li>
                    프로덕트 성격을 고려하여 Next.js의 Static Generation으로
                    페이지 구성 및 빌드
                  </li>
                  <li>
                    Github Actions를 사용해 CI/CD 구성, AWS S3 및 CloudFront,
                    Route53을 통해 정적 웹 페이지 호스팅
                  </li>
                </ul>
              </details>
            </li>
            <li>
              <details open>
                <summary>자동화 기능 개발</summary>
                <ul>
                  <li>
                    배포 이후 사내 백 오피스 개발에 참여하여 포트폴리오 업데이트
                    및 배포 등 자동화 진행
                  </li>
                  <li>
                    포트폴리오 정보 CRUD 툴과 Webhook 통한 제3자 배포 기능 개발
                  </li>
                </ul>
              </details>
            </li>
          </ul>
          <h4> 그 외 사내 백 오피스 개발</h4>
          <p>기술 스택: React, react-hook-form</p>

          <ul>
            <li>
              <p>프로덕트 및 마케팅 팀 지원을 위한 개발에 기능 단위로 참여</p>
            </li>
            <li>
              <p>
                수집한 마케팅 관련 자료의 DB 마이그레이션 기능 (Youtube API,
                DynamoDB)
              </p>
            </li>
          </ul>

          <h2>개인 프로젝트</h2>
          <h3>Galpi | 갈피 (2020. 7 ~ 12)</h3>
          <p>
            좋아하는 책의 글귀를 발췌하고 편집하여 이미지 카드로 업로드 할 수
            있는 소셜 웹 어플리케이션
          </p>
          <p>기술 스택: React, redux, react-router, nodeJS/Express, MongoDB</p>
          <h3>Kinderguri | 킨더구리 (2020. 4 ~ 5)</h3>
          <p>
            구리시에 위치한 유치원과 어린이집에 대한 정보와 위치를 검색할 수
            있는 웹 어플리케이션. 해당 기관에 대한 정보를 data.go.kr에서 제공
            받아 카드 리스트와 카카오 맵으로 렌더링
          </p>
          <p>기술 스택: React, Apollo Server/Client, Open API, KakaoMap API</p>

          <h2>언어</h2>
          <ul>
            <li>
              영어: TOEIC 980. 공식 문서와 스택오버플로우 등 원문으로 필요한
              자료를 찾고, 업무 진행과 협업에 필요한 회화가 가능한 수준
            </li>
            <li>독일어: 논문 독해와 일상 대화 가능한 수준</li>
          </ul>
        </article>
      </div>
    </main>
  );
}

export default About;
