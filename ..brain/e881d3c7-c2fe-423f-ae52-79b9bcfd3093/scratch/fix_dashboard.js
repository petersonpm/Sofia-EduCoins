const fs = require('fs');
const path = require('path');

const filePath = path.resolve('frontend/src/pages/ParentDashboard.jsx');
console.log('Reading file:', filePath);

let content = fs.readFileSync(filePath, 'binary');
console.log('Original file size (bytes):', content.length);

// 0. activeTab === 'summary' close
const p0_crlf = '                  </div>\r\n                )}\r\n              </section>\r\n                 {/* TAB 2: APPROVALS LIST */}';
const p0_lf = '                  </div>\n                )}\n              </section>\n                 {/* TAB 2: APPROVALS LIST */}';
const r0_crlf = '                  </div>\r\n                )}\r\n              </section>\r\n            </div>\r\n          )}\r\n                 {/* TAB 2: APPROVALS LIST */}';
const r0_lf = '                  </div>\n                )}\n              </section>\n            </div>\n          )}\n                 {/* TAB 2: APPROVALS LIST */}';

let replaced0 = false;
if (content.includes(p0_crlf)) {
  content = content.replace(p0_crlf, r0_crlf);
  replaced0 = true;
} else if (content.includes(p0_lf)) {
  content = content.replace(p0_lf, r0_lf);
  replaced0 = true;
}

// 1. activeTab === 'tasks' close
const p1_crlf = '                    ))}\r\n                  </div>\r\n                )}\r\n               {/* TAB 4: FAMILY DEPENDENTS & SAVINGS */}';
const p1_lf = '                    ))}\n                  </div>\n                )}\n               {/* TAB 4: FAMILY DEPENDENTS & SAVINGS */}';
const r1_crlf = '                    ))}\r\n                  </div>\r\n                )}\r\n              </div>\r\n            );\r\n          })()}\r\n               {/* TAB 4: FAMILY DEPENDENTS & SAVINGS */}';
const r1_lf = '                    ))}\n                  </div>\n                )}\n              </div>\n            );\n          })()}\n               {/* TAB 4: FAMILY DEPENDENTS & SAVINGS */}';

let replaced1 = false;
if (content.includes(p1_crlf)) {
  content = content.replace(p1_crlf, r1_crlf);
  replaced1 = true;
} else if (content.includes(p1_lf)) {
  content = content.replace(p1_lf, r1_lf);
  replaced1 = true;
}

// 2. showCreateGoal close
const p2_crlf = '                <button\r\n                  type="submit"\r\n                  disabled={loading}\r\n                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg"\r\n                >\r\n                  Confirmar\r\n                </button>\r\n       {/* REGISTER DEPENDENT/MEMBER MODAL */}';
const p2_lf = '                <button\n                  type="submit"\n                  disabled={loading}\n                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg"\n                >\n                  Confirmar\n                </button>\n       {/* REGISTER DEPENDENT/MEMBER MODAL */}';
const r2_crlf = '                <button\r\n                  type="submit"\r\n                  disabled={loading}\r\n                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg"\r\n                >\r\n                  Confirmar\r\n                </button>\r\n              </div>\r\n            </form>\r\n          </div>\r\n        </div>\r\n      )}\r\n       {/* REGISTER DEPENDENT/MEMBER MODAL */}';
const r2_lf = '                <button\n                  type="submit"\n                  disabled={loading}\n                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg"\n                >\n                  Confirmar\n                </button>\n              </div>\n            </form>\n          </div>\n        </div>\n      )}\n       {/* REGISTER DEPENDENT/MEMBER MODAL */}';

let replaced2 = false;
if (content.includes(p2_crlf)) {
  content = content.replace(p2_crlf, r2_crlf);
  replaced2 = true;
} else if (content.includes(p2_lf)) {
  content = content.replace(p2_lf, r2_lf);
  replaced2 = true;
}

// 3. showAddChild close
const p3_crlf = '                <button\r\n                  type="submit"\r\n                  disabled={loading}\r\n                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-955 bg-[#25cca7] hover:bg-[#1fb393] shadow-lg"\r\n                >\r\n                  Cadastrar\r\n                </      {/* EDIT TASK MODAL */}';
const p3_lf = '                <button\n                  type="submit"\n                  disabled={loading}\n                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-955 bg-[#25cca7] hover:bg-[#1fb393] shadow-lg"\n                >\n                  Cadastrar\n                </      {/* EDIT TASK MODAL */}';
const r3_crlf = '                <button\r\n                  type="submit"\r\n                  disabled={loading}\r\n                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-955 bg-[#25cca7] hover:bg-[#1fb393] shadow-lg"\r\n                >\r\n                  Cadastrar\r\n                </button>\r\n              </div>\r\n            </form>\r\n          </div>\r\n        </div>\r\n      )}\r\n      {/* EDIT TASK MODAL */}';
const r3_lf = '                <button\n                  type="submit"\n                  disabled={loading}\n                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-955 bg-[#25cca7] hover:bg-[#1fb393] shadow-lg"\n                >\n                  Cadastrar\n                </button>\n              </div>\n            </form>\n          </div>\n        </div>\n      )}\n      {/* EDIT TASK MODAL */}';

let replaced3 = false;
if (content.includes(p3_crlf)) {
  content = content.replace(p3_crlf, r3_crlf);
  replaced3 = true;
} else if (content.includes(p3_lf)) {
  content = content.replace(p3_lf, r3_lf);
  replaced3 = true;
}

// 4. showEditTask duplicate closing
const p4_crlf = '\xb5es\r\n                </button>\r\n              </div>\r\n            </form>\r\n          </div>\r\n        </div>\r\n      )}';
const p4_lf = '\xb5es\n                </button>\n              </div>\n            </form>\n          </div>\n        </div>\n      )}';

let replaced4 = false;
if (content.includes(p4_crlf)) {
  content = content.replace(p4_crlf, '');
  replaced4 = true;
} else if (content.includes(p4_lf)) {
  content = content.replace(p4_lf, '');
  replaced4 = true;
}

console.log('Replaced 0:', replaced0);
console.log('Replaced 1:', replaced1);
console.log('Replaced 2:', replaced2);
console.log('Replaced 3:', replaced3);
console.log('Replaced 4:', replaced4);

// Write out the modified binary string as UTF-8
fs.writeFileSync(filePath, content, 'utf8');
console.log('File written successfully in UTF-8 format.');
